# Product Backlog — ft_transcendence - Pong Game

## 📌 Product Overview

**Product Name:** ft_transcendence - Pong Game  
**Vision / Goal:** Web-based Pong game with local and online multiplayer, user accounts, and match statistics  
**Target Users:** Anyone  

**Success Metrics (KPIs):**  
- Users can register, log in and play online  
- No console errors  
- Online match works reliably  
- Deployed with one Docker command  

---

## 🧭 Prioritization

- **P0 (Critical):** Without this, product does not work  
- **P1 (High):** Core experience  
- **P2 (Medium):** UX / robustness  
- **P3 (Low):** Informational / polish  

---

## 📌 Dependencies & Risks

- **Dependencies:** External services, APIs, or features required for completion (e.g., Auth API, WebSockets, Database)  
- **Risks:** Potential blockers or uncertainties (e.g., WebSocket latency, cross-browser issues, player disconnects)  
- Each backlog item may reference specific dependencies or risks in the backlog table  

---

## 🟢 Status Definitions

- **Todo** – Item has not been started yet  
- **In Progress** – Item is currently being worked on  
- **Done** – Item is fully completed and meets Definition of Done  
- **Blocked** – Item cannot proceed due to a dependency or issue  

---

## 📌 Definition of Ready (DoR)

A backlog item is considered “Ready” when:  
- The user story is clearly written and understandable  
- Acceptance criteria are defined  
- Dependencies and blockers are identified  
- Item is small enough to complete in a sprint  

---

## 📌 Definition of Done (DoD)

A backlog item is considered “Done” when:  
- Code is written, reviewed, and merged  
- Unit and integration tests pass  
- Feature deployed to staging/production  
- No console errors or major bugs  
- Documentation updated if needed  

---

## 📌 Notes & Ideas Parking Lot

- Tournament System
- User Interaction (Chat / Friends / Profiles)
- Administrator account to manage users (delete users, etc...)

---

## 📋 Backlog Items

### P0 — Critical (Core System)

| ID    | Title                  | User Story                                      | Dependencies | Notes           | Status      |
|-------|------------------------|-----------------------------------------------|--------------|----------------|------------|
| BL001 | User Registration      | As a user, I want to sign up with email and password so that I can create an account | Auth API, DB | Hashed password | Done       |
| BL002 | User Login             | As a user, I want to log in so that I can access the platform | Auth API | | Done       |
| BL003 | User Logout            | As a user, I want to sign out so that my session is closed | Auth API | | Done       |
| BL005 | Protected Routes       | As a user, I should be redirected to login if not authenticated | Router | | Done       |
| BL006 | Homepage (Public)      | As a visitor, I want to see the project homepage | | | Done       |
| BL007 | Homepage (Logged In)   | As a user, I want a homepage adapted to my session | Auth | | Done       |
| BL008 | Local Game Mode        | As a user, I want to play Pong locally on one device | Game engine | | Done       |
| BL009 | Online Game Mode       | As a user, I want to play against other users online | WebSockets | | Done       |
| BL017 | Score Tracking         | As a user, I want real-time score updates | Game logic | | Done       |
| BL018 | Win Condition          | As a user, I want the game to end at a defined number of points (set in the rules) | Game logic | | Done       |
| BL019 | Match Result Screen    | As a user, I want to see the winner | | | Done       |
| BL020 | Quit Match             | As a user, I want to quit a match with confirmation | Game logic | | Done       |
| BL021 | Play Again Flow        | As a user, I want to start a new match after finishing | | | Done       |

---

### P1 — High (User Profile & Core UX)

| ID    | Title                  | User Story                                      | Dependencies | Notes | Status      |
|-------|------------------------|-----------------------------------------------|--------------|-------|------------|
| BL022 | User Profile Page      | As a user, I want to see my profile | Auth API | | Done |
| BL023 | Edit Profile           | As a user, I want to edit my personal data | Auth API | | Done |
| BL024 | User Stats             | As a user, I want to see my stats | Backend | | Done |
| BL025 | Match History          | As a user, I want to see past matches | Backend | | Done |
| BL044 | Gamification system          | As a user, I want to have a leaderboard, achievements and or rewards for my evolution | Backend | | Done |
| BL026 | Opponent Disconnect    | As a user, I want to be notified if opponent leaves | WebSockets | | Done |
| BL027 | Cannot Connect Error   | As a user, I want an error if match cannot start | Backend | | Done |
| BL028 | Auth Error Messages    | As a user, I want feedback on invalid login/signup | Auth API | | Done |
| BL045 | User Login    | As a user, I want to log in with my 42 account credentials | Auth API | | Done |

---

### P2 — Medium (Technical & UX Requirements)

| ID    | Title                  | User Story                                      | Dependencies | Notes | Status      |
|-------|------------------------|-----------------------------------------------|--------------|-------|------------|
| BL029 | Responsive Layout      | As a user, I want the app to work on all devices | | | Done       |
| BL030 | CSS Framework          | As a developer, I want a CSS framework for UI | | | Done       |
| BL031 | Form Validation        | As a user, I want inputs validated | | | Done       |
| BL032 | No Console Errors      | As a user, I want a clean console | | | Done       |
| BL033 | Chrome Compatibility   | As a user, I want it to work on Chrome | | | Done       |
| BL043 | Firefox Compatibility   | As a user, I want it to work on Firefox | | | Done       |
| BL034 | HTTPS Backend          | As a user, I want secure communication | | | Done       |
| BL035 | Docker Deployment      | As a developer, I want one-command deployment | | | Done       |
| BL036 | Environment Config     | As a developer, I want credentials in .env | | | Done       |
| BL037 | Database Schema        | As a developer, I want clear DB relations | | | Done       |
| BL042 | AI Opponent			 | As a user, I want to play against an AI opponent so that I can practice alone | Game engine | Difficulty levels optional | Done       |

---

### P3 — Low (Informational)

| ID    | Title                  | User Story                                      | Dependencies | Notes | Status      |
|-------|------------------------|-----------------------------------------------|--------------|-------|------------|
| BL038 | About Page             | As a user, I want to read about the project | | | Done       |
| BL039 | How To Play            | As a user, I want instructions | | | Done       |
| BL040 | Privacy Policy         | As a user, I want to read privacy policy | | | Done       |
| BL041 | Terms of Service       | As a user, I want to read terms | | | Done       |

---

## Acceptance Criteria (Key Examples)

**BL002 — User Login**  
- Given a registered user  
- When they enter valid credentials  
- Then they are logged in and redirected to homepage  

- Given invalid credentials  
- When they try to log in  
- Then an error message is shown  

**BL020 — Quit Match**  
- Given user is in match  
- When they click quit  
- Then confirmation dialog appears  
- And on confirm they return to homepage  

**BL026 — Opponent Disconnect**  
- Given match is running  
- When opponent disconnects  
- Then user is notified  
- And match ends safely  
