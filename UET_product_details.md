# Product Summary

## Overview and Target
The Ultimate Expense Tracker mobile app is designed to help users efficiently manage both individual and group expenses. Whether you’re managing household finances, tracking personal spending, or coordinating budgets with roommates, this app offers a comprehensive suite of features to simplify financial management and achieve their financial goals. The app is designed to cater to users with varying needs, from basic personal expense tracking to advanced group financial management, all while ensuring ease of use and fostering responsible financial habits.

---

## Key Features and Core Functionalities

### 1. Expense Tracking
- **Log Expenses**: Users can log their expenses with mandatory fields like date, time, amount, and account, and optional fields such as comments, category, tags, and merchant name.
- **Categories and Tags**: Users are provided with some default expense categories, e.g., food, groceries, etc.; and tags like 'good expense', 'bad expense', etc. Users can create, update, and delete categories and tags as per their requirements.
- **Expense Suggestions**: The app intelligently suggests expenses based on various data sources:
  - **SMS Data and Payment App APIs**: By analyzing transaction messages and payment app data (e.g., Google Pay), the app identifies potential expenses.
  - **Location and Weather Context**: Uses location data to suggest expenses relevant to the user's current location or weather conditions.
  - **Recurring Expense Patterns**: Detects patterns in user spending to identify potential recurring expenses. The app suggests these to the user, who can then choose to mark them as recurring.
  - **Previous Spending Habits**: Learns from past expenses to predict future spending, offering suggestions based on historical data.
  - **Bank Statement Data**: Analyzes uploaded bank statements to identify unlogged transactions and suggest them as expenses.
- **Receipt Scanning**: Users can extract expense data from receipts by taking a photo or selecting an image from their gallery.
- **Reminder**: The app will send reminder notifications to users to log their expenses. Users can set the reminder frequency and time.

### 2. Budgeting and Awards
- **Set Budgets**: Users can set personal budgets for specific categories or overall spending without registration.
- **Budget Tracking**: Users receive notifications when approaching budget limits (e.g., at 80% usage) and when exceeding budgets.
- **Awards for Staying Within Budget**: Monthly awards are given to users who stay within their budget, fostering good financial habits.
- **Gamification**: Within groups, members can compete based on savings, with rankings and awards determined by their ability to stay within allocated budgets.
- **Achievement System**: Users can earn various awards like "Budget Master", "Savings Champion", etc., based on their financial habits and goals.

### 3. Savings Goals
- **Set Goals**: Users can create savings goals with target amounts and dates.
- **Track Progress**: Monitor progress towards savings goals through virtual accounts.
- **Goal Notifications**: Get updates on goal progress and achievement.
- **Goal Categories**: Create different goals for various purposes (vacation, emergency fund, etc.).

### 4. Group Management
- **Create and Manage Groups**: Users can create groups and invite members (e.g., family, roommates) to track collective finances.
- **Group Owners**: Designated group owners can set group budgets, allocate funds to members, and manage group finances.
- **Shared Budgets**: Group members’ income and expenses contribute to a shared budget managed by group owners.

### 5. Virtual Accounts
**Explanation**: Virtual accounts are an abstraction layer to help users better manage and organize their financial goals without the complexity of using multiple physical bank accounts. Virtual accounts are intended to give users a way to segregate funds for different purposes, like budgeting, managing loans, or saving for specific goals. This segregation can be done without requiring the user to open multiple actual bank accounts. Following are the app's features for managing the virtual accounts:
- **Create Virtual Accounts**: Users can create virtual savings and loan accounts to manage funds for specific purposes without registration.
- **Link to Actual Bank Accounts**: Virtual accounts can be mapped to real bank accounts, allowing for easy transfer and tracking of funds.
- **Automated Fund Allocation**: Users can automate the allocation of savings to different virtual accounts based on priority.
- **Loan Installment Tracking**: For loan accounts, users can:
  - Add loan installment details with due dates
  - Set reminder preferences (e.g., notify 5 days before due date)
  - Mark installments as paid with payment reference
  - Get notifications for upcoming, due, and overdue installments
  - View loan repayment history and upcoming schedule

### 6. Expense Splitting
- **Log and Split Expenses**: Group members can log expenses and split them with others in the group. Group owners can configure a limit for the group, where all the split expense requests above that limit must go through their approval before settlement. Group owners can review and approve split requests before they are settled.
- **Split Notifications**: Group owners receive push notifications for new split expense approval requests. Members receive notifications when their split requests are approved/rejected or when they have pending settlements.

### 7. Financial Insights and Dashboards
- **Personalized Dashboards**: Users can visualize their financial health, spending behavior, and savings trends with customizable graphs.
- **Group Financial Overview**: Group owners have access to a group dashboard that provides insights into group finances and member spending.

### 8. Bank Statement Import
- **Sync Income and Expenses**: Users can upload bank statements to extract transactions, with the app suggesting entries that have not been logged, ensuring comprehensive expense tracking.

### 9. Data Export/Import
- **Flexible Data Management**: Users can export and import expense data in .csv or .xlsx formats, facilitating data management across devices.

### 10. Notifications and Reminders
- **Push Notifications**: Users receive important alerts for:
  - Budget warnings (approaching/exceeding limits)
  - Loan installment reminders
  - Split expense approvals/rejections
  - Savings goal achievements
  - Group updates
- **In-App Notifications**: All notifications are available in the app's notification center.
- **Notification Preferences**: Users can enable/disable push notifications.

## UI/UX Preferences
I want you to imagine the best possible layout based on the above application features and target audience. Just keep in mind that the user of this app would mainly use it for either or both of the following purposes: 
1. Managing personal expenses
2. Managing group expenses
Another thing, try using a dark color theme.

## Data Storage Requirements
Suggest the best possible solution/s.

## Authentication Needs
Few features of this application would require registration and authentication, but for building the POC, let's leave out the registration and authentication part. We can get back to this after all the functionalities are implemented.

## Technical Preferences
Not much to say here regarding preference of technology for UI and Database, use the best possible tech out there that best fits the application's usage and future possibilities of scale, etc. 
For backend the preferred language is Golang, but if another language is suited better for a certain functionality then go for it. For example, maybe Python is more suited for the Receipt Scanning functionality.
MUST remember the following rules and objectives while generating code and project structure:
1. The project structure should be modular, scalable, and understandable, this way it should be easier to add features in the future
2. For UI: All the UI properties should be maintained through a theme file, no hardcoding of values like height, colors, etc in the page files
3. No hardcoding of values in application code, the values should come from property files or similar
4. Remember that we are building a progressive web application
5. If you think this application could be broken down into microservices, then go for it
6. Now we are building on a local KIND cluster, but finally, we want to deploy this application on a cloud managed Kubernetes cluster like AWS EKS or GKE.
7. The entire code-base should be version controlled with git. 'dsayan154' is my Github id. Remind committing the code at crucial points of development.

## Must-have Features
All the key features mentioned above are must-haves, prioritize them as you see fit.