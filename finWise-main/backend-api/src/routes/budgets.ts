/**
 * Budget Routes - API endpoints for budget operations
 */

import { Router, Request, Response } from 'express';
import { getConnection, sql } from '../database';

const router = Router();

/**
 * GET /api/budgets - Get all budgets
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM budgets ORDER BY createdAt DESC');

    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budgets'
    });
  }
});

/**
 * GET /api/budgets/progress - Get budget progress with spent amounts
 */
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query(`
        SELECT 
          b.*,
          ISNULL(SUM(e.amount), 0) as spent
        FROM budgets b
        LEFT JOIN expenses e ON e.category = b.category 
          AND e.date BETWEEN b.startDate AND b.endDate
        GROUP BY b.id, b.category, b.amount, b.startDate, b.endDate, b.createdAt, b.updatedAt
        ORDER BY b.createdAt DESC
      `);

    const budgetProgress = result.recordset.map(budget => {
      const spent = parseFloat(budget.spent) || 0;
      const remaining = budget.amount - spent;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
      };
    });

    res.json({
      success: true,
      data: budgetProgress
    });
  } catch (error) {
    console.error('Error getting budget progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget progress'
    });
  }
});

/**
 * GET /api/budgets/:id - Get budget by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', sql.VarChar, id)
      .query('SELECT * FROM budgets WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Budget not found'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error getting budget by ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget'
    });
  }
});

/**
 * POST /api/budgets - Create new budget
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { category, amount, startDate, endDate } = req.body;

    if (!category || !amount || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, amount, startDate, endDate'
      });
    }

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('category', sql.VarChar, category)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(`
        INSERT INTO budgets (category, amount, startDate, endDate, createdAt, updatedAt) 
        OUTPUT INSERTED.*
        VALUES (@category, @amount, @startDate, @endDate, GETDATE(), GETDATE())
      `);

    res.status(201).json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create budget'
    });
  }
});

export default router;
