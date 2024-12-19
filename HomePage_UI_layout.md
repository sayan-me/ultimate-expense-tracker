# UI/UX Preferences
This app will run as a Progressive Web App on client's mobile phone.
Following is the page layout design description.

## *Home Page Layout*
### 1. Top Section (Header):
- **User Greeting**:
Displays a personalized greeting like "Hello, [User Name]!" along with the date.
Example: "Hello, Alex! Welcome back!"
- **Profile Icon (Optional)**:
A small profile picture or icon on the top right that allows the user to access account settings.

### 2. Middle Section (Main Content Area):
This is the scrollable section where the core information is displayed. It is divided into two parts:
**2.1 Quick Actions Section (Top of Main Content)**:
This section contains shortcuts to frequently used features.
Displays circular buttons (shortcuts) for the most-used actions like:
- Log Transactions
- Set Budget
- View Stats
- Notifications
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
- **Mode Toggle Panel**: Horizontal section for switching between Personal and Group modes
  - **Active Mode Display**:
    - Enlarged button with vibrant accent color
    - Prominent text and icon
    - Elevated shadow effect
  - **Inactive Mode Display**:
    - Smaller button
    - Muted colors and reduced opacity
    - Flat design without elevation
  - **Smooth Transition**: Animated switch between modes with position and size changes

#### 4. Activities Bar:
Located at the bottom of the Main Content Area (above the Bottom Navigation Bar).

- **Default State:**
  - Minimized as a thin bar with a visible handle to indicate it can be clicked/swiped up
  - Labelled "Activities"

- **Expanded State:**
- When swiped up or tapped, it expands to cover half of the Overview Section
- Displays a scrollable grid of circular buttons for all actions the user can perform in the selected mode (Personal or Group)

##### Activities Window Content:
**When in Personal Mode:**
- Log Transactions (Expense/Income logging and receipt scanning)
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