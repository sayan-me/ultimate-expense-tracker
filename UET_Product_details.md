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

## Authentication and Access Levels

The application implements a progressive authentication model with three distinct access tiers:

### 1. Basic Features (No Registration Required)
Users can access fundamental features without registration, enabling immediate value from the app:
- Basic expense tracking
- Simple budgeting
- Virtual accounts management
- Basic trend analysis on personal expenses
- Data export/import

### 2. Registered Users (Free Tier)
Registration unlocks additional features:
- Cross-device synchronization
- Group expense management
- Customizable categories and tags
- Enhanced reporting

### 3. Premium Features (Paid Subscription)
Advanced features available to paid subscribers:
- Receipt scanning
- Bank statement analysis
- Advanced insights
- Cloud backup

This tiered approach allows users to test the app's core functionality before committing to registration or paid features.


## UI/UX Preferences
This app will run as a Progressive Web App on client's mobile phone.
Following is the home page layout.
### *Home Page Layout*
### 1. Top Section (Header):
- **User Greeting**:
Displays a personalized greeting like "Hello, [User Name]!" along with the date.
Example: "Hello, Alex! Welcome back!"
- **Profile Icon (Optional)**:
A small profile picture or icon on the top right that allows the user to access account settings.

### 2. Middle Section (Main Content Area):
This is the scrollable section where the core information is displayed. It is divided into two parts:
**2.1 Quick Actions Section (Top of Main Content)**:
Users can drag icons from the Activities Window into this section to create shortcuts to frequently used features.
Displays circular buttons (shortcuts) for the most-used actions like:
- Log Transactions
- Set Budget
- View Stats
- Notifications
- View Recent Expenses
- Add Virtual Account
- Add Savings Goal
- Import Bank Statement
- View Awards
- Export Reports
Provides an "Edit Quick Actions" button to manage these shortcuts.

### 2.2 Overview Section (Below Quick Actions):
This section displays an overview of the user’s finances depending on the active mode (Personal or Group).

#### When Personal Mode is Active:

- **Current Balance**: Displays the total across all personal/virtual accounts.
- **Monthly Spend vs. Budget**: A progress bar showing how much has been spent vs. the budgeted amount.
- **Recent Expenses**:
  Table view with the following items:
  - Last 3 expenses displayed with:
    - Date and time
    - Transaction amount
    - Expense category
    - Brief description/note
  - "View More" link at bottom to access full expense history 

#### When Group Mode is Active:

- **Group Stats**:
  - **Overall Group Expenses**: Shows total group spending for the current month with a button to expand category-wise visualization
  - **Group Budget Status**: Displays current group spending against set monthly budget (if configured)

- **Outstanding Balances Between Members:**
  - Shows a breakdown of amounts owed to or by group members (e.g., "Alex owes Sam $50").

- **Recent Group Activity Feed**:
  - Displays the latest 5 group transactions with:
    - Member name and action (e.g., "Sam added")
    - Transaction title and amount
    - Timestamp
    - Split details if applicable
  - Color-coded status indicators
    - Green for approved transactions
    - Yellow for pending approvals
    - Red for rejected splits
  - "View All Activity" button at bottom

#### 3. Bottom Section (Bottom Navigation Bar):
- **Mode Toggle Panel**: Horizontal scrollable section for switching between Personal and Group modes
  - **Active Mode Display**:
    - Centered, enlarged button with vibrant accent color
    - Prominent text and icon
    - Elevated shadow effect
  - **Inactive Mode Display**:
    - Smaller button positioned to the side
    - Muted colors and reduced opacity
    - Flat design without elevation
  - **Smooth Transition**: Animated switch between modes with position and size changes

#### 4. Activities Bar:
Located at the bottom of the Main Content Area (above the Bottom Navigation Bar).

- **Default State:**
  - Minimized as a thin bar with a visible handle to indicate it's clickable/expandable
  - Labelled "Activities" with a small upward arrow

- **Expanded State:**
- When swiped up or tapped, it expands to cover the Overview Section
- Displays a scrollable grid of circular buttons for all actions the user can perform in the selected mode (Personal or Group)

##### Activities Window Content:
**When in Personal Mode:**
- Log Transactions (merging Expense/Income logging and receipt scanning)
- View Stats
- Set Budget
- Notifications
- Manage Virtual Accounts
- View Loan Accounts
- Analyze Bank Statement
- View Awards & Achievements
- Manage Goals
- Manage Recurring Expenses
- Create/Edit Categories and Tags
- Export/Import Data
- View Budget History

**When in Group Mode:**
- Log Group Transactions
- View Group Stats
- Manage Group Settings:
  - Add/Remove members
  - Assign roles
  - Configure approval settings
  - Set spending limits
- Set Group Budget
- Notifications
- Generate Group Reports:
  - Expense summaries
  - Member contributions
  - Split history
- Settle Balances
- View Split History
- Approve/Reject Split Requests
- Export Group Data
- Group Chat/Comments
- View Group Activity
- Manage Group Categories

#### 5. Overall Layout Features:
Responsive Design:
Adjusts seamlessly to different screen sizes for mobile, tablet, and desktop (PWA compatibility).
Modern Aesthetic:
Clean, minimalistic UI with clear typography and vibrant colors for active components.
Interactive Elements:
Smooth transitions between minimized/expanded views (e.g., Activities Bar).
Drag-and-drop functionality for Quick Actions customization.


## Data Storage Requirements
This app needs to run on client side as a PWA, most of the calculations and storages will be on client's phone. We also don't want every user to store their data on remote database, as it will cost us money. We can provide remote storage of data for only paid customers. 
Appropriate datasore should be selected considering the above.

