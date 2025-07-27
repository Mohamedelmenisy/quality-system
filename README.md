# Quality System - Team Performance Platform

A modern, front-end **Quality Management System** designed to streamline task reviewing, track employee performance, and provide insightful analytics for managers. This project is built with self-contained HTML files, making it incredibly lightweight, fast, and ready for seamless integration with any backend service like Firebase, Supabase, or a custom API.

---

## ✨ Key Features

-   **Role-Based Dashboards**: Customized views for different user roles (Quality Agent, Manager, and Support Agent).
-   **Professional UI/UX**: Clean, modern, and fully responsive design inspired by leading admin panels.
-   **Interactive Components**: Dynamic charts, filterable tables, and intuitive action buttons.
-   **Self-Contained & Lightweight**: No complex setup needed. Everything is bundled within each HTML page for maximum portability.
-   **Ready for Backend Integration**: The front-end is structured to easily connect with APIs for data handling.
-   **Rich Statistics & Reporting**: Visual data representation with charts and stat cards for quick insights.

---

## 🚀 Live Demo (Conceptual)

*You can open the HTML files directly in your browser to see them in action:*

-   **[Landing Page](./index.html)**
-   **[Login Page](./login.html)**
-   **[Sign Up Page](./signup.html)**
-   **[Employee Dashboard](./dashboard-employee.html)** (For Quality Team)
-   **[Manager Dashboard](./dashboard-manager.html)**
-   **[Agent Dashboard](./dashboard-agent.html)** (For other departments)

---

## 👤 User Roles & Dashboards

The system provides a unique interface for each user role to ensure a focused and efficient workflow.

| Role | Dashboard Purpose | Key Functions |
| :--- | :--- | :--- |
| **Quality Agent** | To review assigned orders and identify errors. | - View assigned tasks<br>- Mark tasks with/without errors<br>- Escalate complex cases to a Senior. |
| **Manager** | To get a high-level overview of team performance. | - Filter data by department, team, or employee<br>- View aggregated statistics & charts<br>- Export reports (future-ready). |
| **Support Agent** | To check personal performance and error feedback. | - View only their own flagged tasks<br>- Track personal error rate and types<br>- Filter by date. |
| **Senior Quality**| (To be built) To review escalated orders from Quality Agents. | - View escalated tasks list<br>- Approve or reject agent's findings<br>- Provide detailed feedback. |


---

## 🛠️ Built With

-   **HTML5**: For the core structure of the pages.
-   **CSS3**: For all styling, animations, and responsive design (embedded using `<style>` tags).
-   **JavaScript (ES6)**: For UI interactions and future API connections (embedded using `<script>` tags).
-   **Chart.js**: For creating beautiful and interactive charts on the dashboards.
-   **Google Fonts & Material Icons**: For a clean and modern typography and icon set.

---

## 📁 File Structure

The project is organized into self-contained HTML files for simplicity. No external `assets` folder is needed.

quality-system/
│
├── index.html # Landing Page
├── login.html # Login Page
├── signup.html # New User Registration Page
├── dashboard-employee.html # Dashboard for Quality Agents
├── dashboard-manager.html # Dashboard for Managers
├── dashboard-agent.html # Dashboard for Support Agents (to view their errors)
└── README.md # You are here!

---

## 🔌 Future Integration Plan

This front-end project is the first step. The next phase is to connect it to a backend service.

1.  **Backend Choice**: The system is designed to be compatible with **Supabase** or **Firebase** for easy setup of database and authentication.
2.  **API Connection**: Each page will fetch and post data via a REST API.
3.  **Authentication**: The login and signup pages will be connected to the chosen authentication service. The current redirect is based on a simple string check in the email for demo purposes.

---

## ✅ To-Do / Next Steps

-   [ ] Build the dashboard for the **Senior Quality** role.
-   [ ] Implement a **Settings Page** with theme (Dark/Light) and profile options.
-   [ ] Connect the front-end to a Firebase/Supabase backend.
-   [ ] Enable the "Export to PDF/CSV" functionality for managers.
-   [ ] Make table filters functional using JavaScript.
