# Budget Service

## Overview
The Budget Service manages personal and group budgets in the Ultimate Expense Tracker (UET) application. It handles budget creation, tracking, notifications, and the gamification aspects of budget adherence.

## Features Targeted
- Personal budget management
- Group budget management
- Budget tracking and notifications
- Budget-related awards and gamification

## Core Functionalities

### 1. Budget Management
- Create, update, and delete budgets
- Support for both personal and group budgets
- Category-specific and overall budget tracking
- Budget period management (monthly, weekly, custom)

### 2. Budget Tracking
- Real-time budget utilization tracking
- Warning notifications at configurable thresholds (default 80%)
- Overspending alerts
- Historical budget vs. actual spending analysis (via Analytics Service)

### 3. Budget Awards System
- Track budget adherence
- Issue "Budget Master" awards
- Manage group budget competitions
- Calculate and maintain budget adherence scores

## API Endpoints
```http
### Create a new budget
POST /api/v1/budgets
Content-Type: application/json
{
"name": "Monthly Groceries",
"amount": 500.00,
"start_date": "2024-01-01",
"end_date": "2024-01-31",
"category_id": 2,
"group_id": null, // null for personal budgets
"warning_threshold": 80.00
}

### Get all budgets for user/group
GET /api/v1/budgets?user_id=1&group_id=null
GET /api/v1/budgets?group_id=1

### Get specific budget
GET /api/v1/budgets/{id}
Update budget
PUT /api/v1/budgets/{id}
Delete budget
DELETE /api/v1/budgets/{id}
```
### Get current budget status
GET /api/v1/budgets/{id}/status
### Get budget utilization metrics
GET /api/v1/budgets/{id}/utilization
Get budget warnings
GET /api/v1/budgets/{id}/warnings
### Get historical analysis (proxies to Analytics Service)
GET /api/v1/budgets/{id}/analysis?period=last_6_months
### Get user's budget awards
Get user's budget awards
GET /api/v1/budgets/awards?user_id=1
### Get group budget leaderboard
GET /api/v1/budgets/leaderboard?group_id=1
### Issue new budget award
POST /api/v1/budgets/awards/issue
```

## Integration Points
- Expense Service: For tracking expenses against budgets
- Group Service: For group budget management
- Notification Service: For budget warnings and achievements
- Virtual Account Service: For budget allocation tracking

## Service Dependencies
- **Analytics Service**: For historical budget analysis and spending patterns
- **Expense Service**: For tracking expenses against budgets
- **Group Service**: For group budget management
- **Notification Service**: For budget warnings and achievements
- **Virtual Account Service**: For budget allocation tracking

## Acceptance Criteria
1. Budget Creation
   - Users can create personal budgets without registration
   - Group owners can create and manage group budgets
   - Support for category-specific and overall budgets
   - Validation for budget amounts and periods

2. Budget Tracking
   - Real-time budget utilization tracking
   - Configurable warning thresholds
   - Historical tracking and reporting
   - Support for different budget periods

3. Awards System
   - Automatic award issuance for budget adherence
   - Group competition management
   - Leaderboard maintenance
   - Award history tracking

4. Notifications
   - Warning notifications at 80% utilization
   - Overspending alerts
   - Achievement notifications
   - Group budget status updates
