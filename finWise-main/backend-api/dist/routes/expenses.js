"use strict";
/**
 * Expense Routes - API endpoints for expense operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../database");
const router = (0, express_1.Router)();
/**
 * GET /api/expenses - Get all expenses
 */
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, category, limit } = req.query;
        const pool = await (0, database_1.getConnection)();
        let query = 'SELECT * FROM expenses';
        const conditions = [];
        const request = pool.request();
        if (startDate && endDate) {
            conditions.push('date BETWEEN @startDate AND @endDate');
            request.input('startDate', database_1.sql.Date, startDate);
            request.input('endDate', database_1.sql.Date, endDate);
        }
        if (category) {
            conditions.push('category = @category');
            request.input('category', database_1.sql.VarChar, category);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        query += ' ORDER BY date DESC, createdAt DESC';
        if (limit) {
            query = `SELECT TOP (@limit) * FROM (${query}) AS subquery`;
            request.input('limit', database_1.sql.Int, parseInt(limit));
        }
        const result = await request.query(query);
        res.json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Error getting expenses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch expenses'
        });
    }
});
/**
 * GET /api/expenses/recent - Get recent expenses
 */
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const pool = await (0, database_1.getConnection)();
        const result = await pool.request()
            .input('limit', database_1.sql.Int, limit)
            .query(`
        SELECT TOP (@limit) * FROM expenses 
        ORDER BY date DESC, createdAt DESC
      `);
        res.json({
            success: true,
            data: result.recordset
        });
    }
    catch (error) {
        console.error('Error getting recent expenses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recent expenses'
        });
    }
});
/**
 * GET /api/expenses/total - Get total expenses for date range
 */
router.get('/total', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'startDate and endDate are required'
            });
        }
        const pool = await (0, database_1.getConnection)();
        const result = await pool.request()
            .input('startDate', database_1.sql.Date, startDate)
            .input('endDate', database_1.sql.Date, endDate)
            .query(`
        SELECT ISNULL(SUM(amount), 0) as total
        FROM expenses 
        WHERE date BETWEEN @startDate AND @endDate
      `);
        res.json({
            success: true,
            data: {
                total: parseFloat(result.recordset[0].total) || 0
            }
        });
    }
    catch (error) {
        console.error('Error getting total expenses:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate total expenses'
        });
    }
});
/**
 * GET /api/expenses/stats - Get expense statistics by category
 */
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const pool = await (0, database_1.getConnection)();
        let query = `
      SELECT 
        category,
        ISNULL(SUM(amount), 0) as total,
        COUNT(*) as count,
        ISNULL(AVG(amount), 0) as average
      FROM expenses
    `;
        const request = pool.request();
        if (startDate && endDate) {
            query += ' WHERE date BETWEEN @startDate AND @endDate';
            request.input('startDate', database_1.sql.Date, startDate);
            request.input('endDate', database_1.sql.Date, endDate);
        }
        query += ' GROUP BY category ORDER BY total DESC';
        const result = await request.query(query);
        const stats = result.recordset.map(row => ({
            category: row.category,
            total: parseFloat(row.total) || 0,
            count: parseInt(row.count) || 0,
            average: parseFloat(row.average) || 0,
        }));
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('Error getting expense statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch expense statistics'
        });
    }
});
/**
 * GET /api/expenses/:id - Get expense by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await (0, database_1.getConnection)();
        const result = await pool.request()
            .input('id', database_1.sql.VarChar, id)
            .query('SELECT * FROM expenses WHERE id = @id');
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Expense not found'
            });
        }
        res.json({
            success: true,
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Error getting expense by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch expense'
        });
    }
});
/**
 * POST /api/expenses - Create new expense
 */
router.post('/', async (req, res) => {
    try {
        const { amount, category, description, date, paymentMethod } = req.body;
        if (!amount || !category || !description || !date || !paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: amount, category, description, date, paymentMethod'
            });
        }
        const pool = await (0, database_1.getConnection)();
        const result = await pool.request()
            .input('amount', database_1.sql.Decimal(10, 2), amount)
            .input('category', database_1.sql.VarChar, category)
            .input('description', database_1.sql.VarChar, description)
            .input('date', database_1.sql.Date, date)
            .input('paymentMethod', database_1.sql.VarChar, paymentMethod)
            .query(`
        INSERT INTO expenses (amount, category, description, date, paymentMethod, createdAt, updatedAt) 
        OUTPUT INSERTED.*
        VALUES (@amount, @category, @description, @date, @paymentMethod, GETDATE(), GETDATE())
      `);
        res.status(201).json({
            success: true,
            data: result.recordset[0]
        });
    }
    catch (error) {
        console.error('Error creating expense:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create expense'
        });
    }
});
exports.default = router;
