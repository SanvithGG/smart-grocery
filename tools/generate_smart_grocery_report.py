# pyright: reportMissingImports=false, reportMissingTypeStubs=false
from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.graphics.shapes import Drawing, Line, Rect, String


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "docs"
OUTPUT_PATH = OUTPUT_DIR / "Smart_Grocery_Project_Report.pdf"


def read_snippet(path: Path, start: int, end: int) -> str:
    lines = path.read_text(encoding="utf-8").splitlines()
    selected = lines[start - 1 : end]
    return "\n".join(selected)


def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#475569"))
    canvas.drawString(doc.leftMargin, 1.2 * cm, "Smart Grocery Project Report")
    canvas.drawRightString(A4[0] - doc.rightMargin, 1.2 * cm, f"Page {doc.page}")
    canvas.restoreState()


def architecture_diagram() -> Drawing:
    d = Drawing(460, 240)

    boxes = [
        (20, 150, 110, 50, "React Frontend"),
        (175, 150, 120, 50, "Spring Boot API"),
        (340, 150, 105, 50, "MySQL Database"),
        (20, 55, 110, 50, "JWT / Router Guard"),
        (175, 55, 120, 50, "Business Logic"),
        (340, 55, 105, 50, "Admin Analytics"),
    ]

    for x, y, w, h, label in boxes:
        d.add(Rect(x, y, w, h, rx=10, ry=10, fillColor=colors.HexColor("#E2E8F0"), strokeColor=colors.HexColor("#334155")))
        d.add(String(x + w / 2, y + h / 2 - 4, label, textAnchor="middle", fontName="Helvetica-Bold", fontSize=10, fillColor=colors.HexColor("#0F172A")))

    arrows = [
        (130, 175, 175, 175),
        (295, 175, 340, 175),
        (75, 150, 75, 105),
        (235, 150, 235, 105),
        (392, 150, 392, 105),
        (130, 80, 175, 80),
        (295, 80, 340, 80),
    ]

    for x1, y1, x2, y2 in arrows:
        d.add(Line(x1, y1, x2, y2, strokeColor=colors.HexColor("#0EA5E9"), strokeWidth=2))

    notes = [
        (75, 18, "User pages: Home, Dashboard, Inventory, Shopping List"),
        (235, 18, "Controllers, services, validation, recommendations, expiry logic"),
        (392, 18, "users + grocery_items tables"),
    ]
    for x, y, text in notes:
        d.add(String(x, y, text, textAnchor="middle", fontName="Helvetica", fontSize=8, fillColor=colors.HexColor("#475569")))

    return d


def er_diagram() -> Drawing:
    d = Drawing(460, 220)

    d.add(Rect(45, 90, 150, 95, rx=10, ry=10, fillColor=colors.HexColor("#DBEAFE"), strokeColor=colors.HexColor("#1D4ED8")))
    d.add(String(120, 165, "users", textAnchor="middle", fontName="Helvetica-Bold", fontSize=11))
    for idx, field in enumerate(["id (PK)", "username", "email", "password", "role"]):
        d.add(String(65, 145 - idx * 16, field, fontName="Helvetica", fontSize=9))

    d.add(Rect(255, 70, 165, 125, rx=10, ry=10, fillColor=colors.HexColor("#DCFCE7"), strokeColor=colors.HexColor("#15803D")))
    d.add(String(337, 175, "grocery_items", textAnchor="middle", fontName="Helvetica-Bold", fontSize=11))
    for idx, field in enumerate(
        [
            "id (PK)",
            "name",
            "category",
            "quantity",
            "purchased",
            "expiry_date",
            "last_purchased_at",
            "user_id (FK)",
        ]
    ):
        d.add(String(275, 155 - idx * 14, field, fontName="Helvetica", fontSize=9))

    d.add(Line(195, 132, 255, 132, strokeColor=colors.HexColor("#0F172A"), strokeWidth=2))
    d.add(String(225, 142, "1 : many", textAnchor="middle", fontName="Helvetica-Bold", fontSize=9))
    return d


def make_cover(styles):
    return [
        Spacer(1, 5.5 * cm),
        Paragraph("SMART GROCERY", styles["CoverTitle"]),
        Spacer(1, 0.5 * cm),
        Paragraph("Project Report", styles["CoverSubtitle"]),
        Spacer(1, 1.2 * cm),
        Paragraph(
            "A full-stack grocery planning and inventory management system with user authentication, "
            "smart shopping recommendations, low-stock alerts, expiry reminders, and admin analytics.",
            styles["Lead"],
        ),
        Spacer(1, 1.2 * cm),
        Paragraph(f"Prepared from the repository source as of {date(2026, 4, 19).strftime('%d %B %Y')}", styles["Body"]),
        Spacer(1, 0.3 * cm),
        Paragraph(str(ROOT), styles["Body"]),
        PageBreak(),
    ]


def make_table(data, col_widths=None, header_bg="#0F172A"):
    table = Table(data, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(header_bg)),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def section_heading(title: str, styles):
    return [Paragraph(title, styles["Section"]), Spacer(1, 0.15 * cm)]


def subsection(title: str, body: str, styles):
    return [
        Paragraph(title, styles["Subsection"]),
        Paragraph(body, styles["Body"]),
        Spacer(1, 0.18 * cm),
    ]


def build_report():
    OUTPUT_DIR.mkdir(exist_ok=True)

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSubtitle",
            fontName="Helvetica",
            fontSize=18,
            leading=22,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0369A1"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Lead",
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            fontName="Helvetica-Bold",
            fontSize=17,
            leading=22,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subsection",
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1D4ED8"),
            spaceBefore=6,
            spaceAfter=2,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            fontName="Helvetica",
            fontSize=10.2,
            leading=15,
            alignment=TA_JUSTIFY,
            textColor=colors.HexColor("#1E293B"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Small",
            fontName="Helvetica",
            fontSize=8.8,
            leading=12,
            textColor=colors.HexColor("#475569"),
        )
    )

    auth_snippet = read_snippet(ROOT / "backend/src/main/java/com/example/backend/service/AuthService.java", 19, 52)
    grocery_snippet = read_snippet(ROOT / "backend/src/main/java/com/example/backend/service/GroceryService.java", 148, 240)
    dashboard_snippet = read_snippet(ROOT / "frontend/src/pages/DashboardPage.jsx", 1, 80)
    report_snippet = read_snippet(ROOT / "frontend/src/pages/AdminReportsPage.jsx", 1, 64)

    flow = []
    flow.extend(make_cover(styles))

    flow.extend(section_heading("Index", styles))
    flow.append(
        make_table(
            [
                ["Sl. No.", "Topic", "Indicative Coverage"],
                ["1", "Introduction", "Project overview, scope, objectives, feasibility"],
                ["2", "Literature Survey / Tools", "Existing systems, software stack, hardware needs"],
                ["3", "Project Design", "Modules, architecture, component interaction"],
                ["4", "Database Design", "Entities, relationships, schema interpretation"],
                ["5", "Development / Implementation", "Milestones, workflow, major coding stages"],
                ["6", "Testing", "Validation approach, executed checks, observed outcomes"],
                ["7", "Results", "Feature outcomes, representative code excerpts, UI summary"],
                ["8", "Conclusion", "Impact and future enhancement directions"],
                ["9", "Bibliography & References", "Documentation, frameworks, repository evidence"],
            ],
            [1.8 * cm, 7.8 * cm, 7.4 * cm],
        )
    )
    flow.append(PageBreak())

    flow.extend(section_heading("1. Introduction", styles))
    flow.extend(
        subsection(
            "1.1 Introduction",
            "Smart Grocery is a full-stack web application designed to help users plan groceries, manage household inventory, "
            "track purchased versus pending items, and receive actionable reminders for low-stock or near-expiry products. "
            "The project combines a React-based client, a Spring Boot API, JWT-based authentication, and a MySQL-backed "
            "persistence layer. In addition to routine CRUD operations, the system adds decision-support features such as "
            "recommendations, smart shopping suggestions, expiry-aware reminders, and administrator reporting.",
            styles,
        )
    )
    flow.extend(
        subsection(
            "1.2 Scope",
            "The system serves both normal users and administrators. Users can register, log in, maintain their own grocery "
            "lists, mark items as purchased, estimate or store expiry dates, review dashboard insights, and act on a smart "
            "shopping queue. Administrators can monitor users, manage roles, inspect all products, maintain catalog stock, "
            "process pending purchase queues, rename categories, and analyze aggregate reports.",
            styles,
        )
    )
    flow.extend(
        subsection(
            "1.3 Objectives",
            "The primary objectives are to simplify grocery planning, reduce stock-outs in the home, improve awareness of "
            "expiring items, and provide centralized operational control. The project also aims to demonstrate a secure "
            "multi-role web architecture, clear API design, validation, and measurable testing outcomes.",
            styles,
        )
    )
    flow.extend(
        subsection(
            "1.4 Feasibility Study",
            "Technical feasibility is strong because the project relies on widely adopted technologies: React and Vite for "
            "the frontend, Spring Boot and JPA for backend services, and MySQL for relational storage. Operationally, the "
            "system is practical because the browser interface provides clear workflows for both users and administrators. "
            "Economically, the stack is cost-effective because it is built with open-source tools and standard development "
            "environments. The project is therefore feasible for academic demonstration and extensible for real-world use.",
            styles,
        )
    )

    flow.extend(section_heading("2. Literature Survey and Software & Hardware Tools", styles))
    flow.extend(
        subsection(
            "2.1 Literature Survey",
            "Inventory and grocery reminder applications commonly provide item lists and simple status tracking, but many "
            "consumer solutions do not connect inventory management with expiry awareness, recommendation generation, or "
            "an administrator-level operational view. Smart Grocery improves on these gaps by combining household list "
            "management, stock-state awareness, smart restock logic, and analytics in one cohesive platform.",
            styles,
        )
    )
    flow.extend(
        subsection(
            "2.2 Software Tools",
            "The project uses React 19, React Router, Axios, Tailwind CSS 4, and Lucide icons on the frontend. The backend "
            "uses Spring Boot 4, Spring Security, Spring Validation, JPA, MySQL Connector/J, Lombok, and JJWT. Version "
            "control and repository management are handled through Git, while development is structured around the Maven "
            "wrapper and npm scripts.",
            styles,
        )
    )
    flow.append(
        make_table(
            [
                ["Layer", "Tools / Libraries", "Purpose"],
                ["Frontend", "React, Vite, React Router, Axios, Tailwind CSS", "User interface, routing, API communication, styling"],
                ["Backend", "Spring Boot, Spring Security, Validation, JPA", "REST API, security, validation, persistence"],
                ["Database", "MySQL", "Structured storage for users and grocery items"],
                ["Auth", "JWT", "Token-based session security"],
                ["Testing", "JUnit, Spring test starters, ESLint", "Backend verification and frontend static checks"],
            ],
            [3 * cm, 6.5 * cm, 6.5 * cm],
        )
    )
    flow.append(Spacer(1, 0.25 * cm))
    flow.extend(
        subsection(
            "2.3 Hardware Requirements",
            "A standard development laptop or desktop with Java 21+, Node.js 20+, and MySQL 8+ is sufficient for the "
            "system. Since the application is web-based, the runtime hardware demand is modest: a local server for the API, "
            "a database instance, and any modern browser for client access.",
            styles,
        )
    )

    flow.extend(section_heading("3. Project Design", styles))
    flow.extend(
        subsection(
            "3.1 Design Details of Modules",
            "The system is organized into authentication, inventory, dashboard, shopping list, expiry reminder, and admin "
            "management modules. Each module is represented by dedicated frontend pages and corresponding backend endpoints. "
            "The separation keeps concerns clear: controllers expose route contracts, services implement rules, repositories "
            "perform persistence, and the UI layers transform API responses into task-focused screens.",
            styles,
        )
    )
    flow.append(
        make_table(
            [
                ["Module", "Key Responsibilities"],
                ["Authentication", "Register users, validate login credentials, issue JWT tokens, restrict routes by role"],
                ["Inventory", "Add items, update quantities, mark purchased status, delete items, filter by search/category/status"],
                ["Dashboard", "Show summary cards, recommendations, low-stock watchlist, recent items, expiry alerts"],
                ["Shopping List", "Auto-build a buy queue from low stock and near-expiry logic"],
                ["Admin", "Manage users, products, category renaming, stock levels, purchase queue, reports"],
            ],
            [4 * cm, 12 * cm],
            header_bg="#1D4ED8",
        )
    )
    flow.append(Spacer(1, 0.2 * cm))
    flow.extend(section_heading("3.2 Architecture Diagram", styles))
    flow.append(architecture_diagram())
    flow.append(Spacer(1, 0.3 * cm))
    flow.append(
        Paragraph(
            "The architecture follows a client-server pattern. React pages call the Spring Boot REST API through Axios. "
            "The API enforces authentication and authorization with JWT and Spring Security, delegates business rules to "
            "services, and persists records through JPA to MySQL. Admin reporting is derived from the same centralized data model.",
            styles["Body"],
        )
    )

    flow.extend(section_heading("4. Database Design", styles))
    flow.extend(
        subsection(
            "4.1 E-R Interpretation",
            "The data model is intentionally compact. A user owns many grocery items, while each grocery item belongs to a "
            "single user. Grocery items store workflow-relevant data such as quantity, purchase state, expiry date, and last "
            "purchase time. This model supports both user-facing operations and aggregate administrative analytics.",
            styles,
        )
    )
    flow.append(er_diagram())
    flow.append(Spacer(1, 0.25 * cm))
    flow.append(
        make_table(
            [
                ["Entity", "Important Fields", "Remarks"],
                ["users", "id, username, email, password, role", "Supports USER and ADMIN roles"],
                ["grocery_items", "id, name, category, quantity, purchased, expiry_date, last_purchased_at, user_id", "Stores household inventory records"],
            ],
            [3 * cm, 7.5 * cm, 5.5 * cm],
            header_bg="#15803D",
        )
    )

    flow.extend(section_heading("5. Development / Implementation Stages", styles))
    flow.append(
        make_table(
            [
                ["Stage", "Implementation Outcome"],
                ["Requirement Analysis", "Defined roles, grocery CRUD, dashboard insights, and admin controls"],
                ["Environment Setup", "Initialized React/Vite frontend, Spring Boot backend, and MySQL configuration"],
                ["Authentication", "Implemented register/login/admin login with password hashing and JWT token generation"],
                ["User Inventory", "Built grocery CRUD, filters, category aggregation, and purchased-state transitions"],
                ["Smart Features", "Added recommendation rules, low-stock watchlist, shopping queue, and expiry alert logic"],
                ["Admin Suite", "Implemented admin dashboard, users, products, category rename, stock control, and reports"],
                ["Validation & Testing", "Added controller/service tests, error handling, linting, and verification runs"],
            ],
            [3.6 * cm, 11.4 * cm],
            header_bg="#7C3AED",
        )
    )
    flow.append(Spacer(1, 0.2 * cm))
    flow.append(
        Paragraph(
            "The repository history and current source layout show an incremental build-out from core authentication and CRUD "
            "toward operational intelligence. The introduction of expiry-date derivation, recommendation scoring, catalog "
            "stock tracking, and admin reporting demonstrates a move beyond a basic list manager into a rule-driven planning system.",
            styles["Body"],
        )
    )

    flow.extend(section_heading("6. Testing", styles))
    flow.append(
        make_table(
            [
                ["Verification Item", "Execution Date", "Observed Result"],
                ["Frontend lint (`npm run lint`)", "19 April 2026", "Passed"],
                ["Frontend build (`npm run build`)", "19 April 2026", "Blocked in current environment by native Tailwind/Vite dependency loading (`spawn EPERM`)"],
                ["Backend tests (`.\\mvnw.cmd test`)", "19 April 2026", "Passed with 50 tests, 0 failures, 0 errors, 0 skipped"],
            ],
            [5.4 * cm, 3 * cm, 8.6 * cm],
            header_bg="#B45309",
        )
    )
    flow.append(Spacer(1, 0.2 * cm))
    flow.append(
        Paragraph(
            "Backend verification covered application bootstrap, authentication, controller behavior, and grocery service logic. "
            "The current build observation is included exactly as executed in this workspace for accuracy. The frontend codebase "
            "remains lint-clean, but a full production build should be re-run in an environment where the native Tailwind binary "
            "can load correctly.",
            styles["Body"],
        )
    )

    flow.extend(section_heading("7. Results", styles))
    flow.extend(
        subsection(
            "7.1 Functional Results",
            "The completed project delivers a role-based grocery planning workflow. User-facing results include secure login, "
            "inventory management, category-aware filtering, real-time dashboard insights, automatic shopping suggestions, and "
            "kitchen expiry reminders. Administrative results include platform-wide monitoring, product control, category "
            "maintenance, purchase-queue fulfillment, stock adjustment, and reporting by category.",
            styles,
        )
    )
    flow.append(
        make_table(
            [
                ["Screen / Feature", "Observed Outcome"],
                ["Dashboard", "Summary cards, smart picks, low-stock action board, kitchen reminders, recent list"],
                ["Inventory", "Add/edit/delete groceries, category selection, purchase toggle, expiry display"],
                ["Shopping List", "Auto-built buy suggestions from low stock and near-expiry items"],
                ["Admin Dashboard", "Platform counts for users, products, categories, pending items, and stock pressure"],
                ["Admin Reports", "Top categories, category breakdown, expiring-soon totals"],
            ],
            [4 * cm, 12 * cm],
            header_bg="#BE123C",
        )
    )
    flow.append(Spacer(1, 0.25 * cm))
    flow.extend(subsection("7.2 Sample Backend Code", "Representative excerpts from the current repository are included below.", styles))
    flow.append(Paragraph("Authentication service excerpt", styles["Subsection"]))
    flow.append(Preformatted(auth_snippet, styles["Small"]))
    flow.append(Spacer(1, 0.2 * cm))
    flow.append(Paragraph("Recommendation and expiry logic excerpt", styles["Subsection"]))
    flow.append(Preformatted(grocery_snippet, styles["Small"]))
    flow.append(PageBreak())
    flow.extend(subsection("7.3 Sample Frontend Code", "The frontend coordinates data loading, dashboard composition, and admin reporting views.", styles))
    flow.append(Paragraph("Dashboard page excerpt", styles["Subsection"]))
    flow.append(Preformatted(dashboard_snippet, styles["Small"]))
    flow.append(Spacer(1, 0.2 * cm))
    flow.append(Paragraph("Admin reports page excerpt", styles["Subsection"]))
    flow.append(Preformatted(report_snippet, styles["Small"]))

    flow.extend(section_heading("8. Conclusion", styles))
    flow.append(
        Paragraph(
            "Smart Grocery successfully demonstrates a modern full-stack application that extends beyond simple grocery CRUD. "
            "Its main contribution is the combination of operational inventory control and decision-support logic in a single "
            "system. Users benefit from practical reminders and recommendations, while administrators gain visibility into "
            "system-wide activity. Future enhancements could include real purchase history analytics, barcode integration, "
            "notification delivery, richer charts, and deployment-ready build automation.",
            styles["Body"],
        )
    )

    flow.extend(section_heading("9. Bibliography & References", styles))
    for ref in [
        "Smart Grocery repository source code, accessed from the local workspace on 19 April 2026.",
        "Spring Boot official documentation for web, security, and JPA concepts.",
        "React and React Router documentation for component-driven frontend routing.",
        "Axios documentation for HTTP client integration.",
        "MySQL documentation for relational database concepts.",
        "JWT (JSON Web Token) documentation and library usage references.",
    ]:
        flow.append(Paragraph(f"• {ref}", styles["Body"]))

    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        rightMargin=1.6 * cm,
        leftMargin=1.8 * cm,
        topMargin=1.7 * cm,
        bottomMargin=1.7 * cm,
        title="Smart Grocery Project Report",
        author="OpenAI Codex",
    )
    doc.build(flow, onFirstPage=on_page, onLaterPages=on_page)


if __name__ == "__main__":
    build_report()
    print(OUTPUT_PATH)
