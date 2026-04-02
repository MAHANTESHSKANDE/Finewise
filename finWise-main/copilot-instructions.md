# PocketBudget Development Guide

## Overview
PocketBudget is a production-ready React Native mobile app for personal finance management. Built with React Native CLI, TypeScript, SQLite, and AI-powered categorization.

## Project Structure
```
src/
├── components/           # Reusable UI components
├── database/            # SQLite database layer
├── navigation/          # React Navigation setup
├── screens/             # App screens/pages
├── services/            # External services (AI, API calls)
├── styles/              # Theme and styling
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Key Features

### 1. Expense Management
- Add, edit, delete expenses
- AI-powered categorization using Hugging Face
- Photo attachments and notes
- Multiple payment methods

### 2. Budget Tracking
- Set monthly/custom budgets by category
- Real-time progress tracking
- Overspending alerts
- Visual progress indicators

### 3. Reports & Analytics
- Interactive charts with Victory Native
- Spending trends and patterns
- Category breakdowns
- Export capabilities

### 4. Data Management
- SQLite local storage
- Database migrations
- Data backup/restore
- Performance optimized queries

## Technical Stack

### Core Technologies
- **React Native CLI**: 0.80.2 with Metro bundler
- **TypeScript**: Full type safety
- **SQLite**: Local data storage via react-native-sqlite-storage
- **React Navigation**: Bottom tabs + stack navigation

### Key Dependencies
```json
{
  "react-navigation": "Bottom tabs + native stack",
  "react-native-sqlite-storage": "Database management",
  "victory-native": "Charts and data visualization",
  "react-native-vector-icons": "Icon library",
  "axios": "HTTP client for API calls",
  "react-native-safe-area-context": "Safe area handling"
}
```

## Architecture

### Database Schema
- **expenses**: Core expense records
- **budgets**: Budget configurations
- **categories**: Expense categorization
- **migrations**: Schema version management

### Services Layer
- **DatabaseManager**: SQLite operations
- **AICategorizer**: Expense categorization
- **ExpenseRepository**: Expense CRUD operations  
- **BudgetRepository**: Budget management

### State Management
- React hooks and local state
- Context API for shared state
- Repository pattern for data access

## Development Setup

### Prerequisites
```bash
# Node.js 18+
node --version

# React Native CLI
npm install -g @react-native-community/cli

# Android Studio (for Android development)
# Xcode (for iOS development - macOS only)
```

### Installation
```bash
# Clone and install
git clone <repository-url>
cd pocketBudget
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Android setup
# Open Android Studio and sync project
```

### Running the App
```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android  
npm run android
```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React Native best practices
- Implement proper error handling
- Write meaningful commit messages

### Component Structure
```typescript
// Component template
interface ComponentProps {
  // Define props with TypeScript
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  return (
    // JSX
  );
};

export default Component;
```

### Database Operations
```typescript
// Always use repositories
import { expenseRepository } from '../database/expenseRepository';

// Handle async operations properly
try {
  const expenses = await expenseRepository.getAllExpenses();
  // Process data
} catch (error) {
  errorUtils.logError(error, 'ComponentName.methodName');
  // Handle error
}
```

### Error Handling
```typescript
import { errorUtils } from '../utils';

try {
  // Risky operation
} catch (error) {
  errorUtils.logError(error as Error, 'Context.Method');
  const userMessage = errorUtils.getUserFriendlyMessage(error as Error);
  Alert.alert('Error', userMessage);
}
```

## Testing

### Unit Tests
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Test Structure
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something', () => {
      // Test implementation
    });
  });
});
```

## AI Configuration

### Hugging Face Setup
1. Create account at https://huggingface.co
2. Get API key from settings
3. Add to environment variables:
```bash
# Development
export HUGGING_FACE_API_KEY="your-api-key"

# Production
# Set in build environment
```

### Fallback System
- AI categorization with Hugging Face API
- Keyword-based fallback when API unavailable
- Mock categorization in development mode

## Database Management

### Migrations
```typescript
// Adding new migration
const migration: DatabaseMigration = {
  version: 2,
  statements: [
    'ALTER TABLE expenses ADD COLUMN photo_url TEXT;',
    'CREATE INDEX idx_expenses_photo ON expenses(photo_url);'
  ]
};
```

### Performance
- Use database indexing for queries
- Implement pagination for large datasets
- Use transactions for batch operations
- Cache frequently accessed data

## Deployment

### Android Release
```bash
# Generate signed APK
cd android
./gradlew assembleRelease

# Generate AAB for Play Store
./gradlew bundleRelease
```

### iOS Release
```bash
# Build for release
npx react-native run-ios --configuration Release

# Archive in Xcode for App Store
```

## Troubleshooting

### Common Issues

#### Metro Bundler
```bash
# Clear cache
npm start -- --reset-cache
```

#### Android Build
```bash
# Clean build
cd android && ./gradlew clean && cd ..
npm run android
```

#### iOS Build
```bash
# Clean build
cd ios && xcodebuild clean && cd ..
npm run ios
```

#### Database Issues
- Check SQLite file permissions
- Verify migration order
- Use database debugging tools

## Performance Optimization

### React Native Best Practices
- Use FlatList for large lists
- Implement proper image optimization
- Use memo() for expensive components
- Optimize bundle size

### Database Optimization
- Use appropriate indexes
- Limit query result sets
- Implement caching strategies
- Use prepared statements

## Security Considerations

### Data Protection
- Encrypt sensitive data
- Use secure storage for API keys
- Implement proper input validation
- Handle permissions properly

### API Security
- Use HTTPS for all API calls
- Implement proper authentication
- Handle API keys securely
- Rate limit API requests

## Contributing

### Pull Request Process
1. Create feature branch
2. Write tests for new functionality
3. Update documentation
4. Submit pull request
5. Pass code review

### Code Review Checklist
- [ ] TypeScript types defined
- [ ] Error handling implemented
- [ ] Tests written and passing
- [ ] Performance considered
- [ ] Documentation updated

## Support

### Resources
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/)
- [SQLite Documentation](https://www.sqlite.org/)
- [Victory Native Charts](https://commerce.nearform.com/open-source/victory-native/)

### Getting Help
- Check existing issues on GitHub
- Review documentation and guides
- Ask questions in team channels
- Create detailed issue reports

---

## Recent Updates

### Version 1.0.0 (Current)
- ✅ Complete app architecture
- ✅ All core screens implemented
- ✅ Database layer with migrations
- ✅ AI categorization service
- ✅ React Navigation setup
- ✅ TypeScript integration
- ✅ Comprehensive testing setup
- ✅ Production-ready configuration

### Upcoming Features
- [ ] Data export/import
- [ ] Cloud synchronization
- [ ] Receipt scanning with OCR
- [ ] Advanced reporting
- [ ] Multi-currency support
- [ ] Dark theme support

---

*Last updated: December 2024*
