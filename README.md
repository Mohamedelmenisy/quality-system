# Quality System - Team Performance Platform

A modern, front-end **Quality Management System** designed to streamline task reviewing, track employee performance, and provide insightful analytics for managers. This project is built with self-contained HTML files, making it incredibly lightweight, fast, and ready for seamless integration with any backend service like Firebase, Supabase, or a custom API.

![Manager Dashboard Preview](https://i.imgur.com/your-manager-dashboard-image.png) <!-- Replace with a real screenshot URL -->

---

## ✨ Key Features

-   **Role-Based Dashboards**: Customized views for different user roles (Quality Agent, Senior, Manager, and Agent).
-   **Professional UI/UX**: Clean, modern, and fully responsive design inspired by today's leading admin panels.
-   **Interactive Components**: Dynamic charts, filterable tables, and intuitive action buttons.
-   **Self-Contained & Lightweight**: No external CSS/JS files. Everything is bundled within each HTML page for maximum portability.
-   **Ready for Backend Integration**: The front-end is structured to easily connect with APIs for data handling.
-   **Rich Statistics & Reporting**: Visual data representation with charts and stat cards for quick insights.

---

## 🚀 Live Demo

*You can view a live demo of the different pages here:*

-   **[Login Page](https://mohamedelmenisy.github.io/quality-system/login.html)**
-   **[Sign Up Page](https://mohamedelmenisy.github.io/quality-system/signup.html)**
-   **[Employee Dashboard](https://mohamedelmenisy.github.io/quality-system/dashboard-employee.html)**
-   **[Manager Dashboard](https://mohamedelmenisy.github.io/quality-system/dashboard-manager.html)**

---

## 👤 User Roles & Dashboards

The system provides a unique interface for each user role to ensure a focused and efficient workflow.

| Role | Dashboard Purpose | Key Functions |
| :--- | :--- | :--- |
| **Quality Agent** | To review assigned orders and identify errors. | - View assigned tasks<br>- Mark tasks with/without errors<br>- Specify error type & reason<br>- Escalate complex cases to a Senior. |
| **Senior Quality** | To review escalated orders from Quality Agents. | - View escalated tasks list<br>- Approve or reject agent's findings<br>- Provide detailed feedback. |
| **Manager** | To get a high-level overview of team performance. | - Filter data by department, team, or employee<br>- View aggregated statistics & charts<br>- Export reports (future-ready). |
| **Agent (Other Dept.)** | To check personal performance and error feedback. | - View only their own flagged tasks<br>- Track error types and frequency<br>- Filter by date. |

---

## 🛠️ Built With

-   **HTML5**: For the core structure of the pages.
-   **CSS3**: For all styling, animations, and responsive design (embedded using `<style>` tags).
-   **JavaScript (ES6)**: For UI interactions and future API connections (embedded using `<script>` tags).
-   **Chart.js**: For creating beautiful and interactive charts on the Manager's dashboard.
-   **Google Fonts & Material Icons**: For a clean and modern typography and icon set.

---

## 📁 File Structure

The project is intentionally organized into self-contained HTML files for simplicity and portability. No external `assets` folder is needed.

```
quality-system/
│
├── login.html              # Login Page
├── signup.html             # New User Registration Page
├── dashboard-employee.html # Dashboard for Quality Agents
├── dashboard-manager.html  # Dashboard for Managers
├── README.md               # You are here!
```

---

## 🔌 Future Integration Plan

This front-end project is the first step. The next phase is to connect it to a backend service.

1.  **Backend Choice**: The system is designed to be compatible with **Supabase** or **Firebase** for easy setup of database and authentication.
2.  **API Connection**: Each page will fetch and post data via a REST API.
3.  **Data Source**: Data can be pulled from Google Sheets, Metabase, or any other database through the backend.
4.  **Authentication**: The login and signup pages will be connected to the chosen authentication service.

---

## To-Do / Next Steps

-   [ ] Build the dashboard for the **Senior Quality** role.
-   [ ] Build the dashboard for the **Agent (Other Dept.)** role.
-   [ ] Connect the front-end to a Firebase/Supabase backend.
-   [ ] Implement user authentication.
-   [ ] Enable the "Export to PDF/CSV" functionality for managers.
