# CLAUDE.md — Stellar Hackathons & Events Backend

This document defines engineering principles, architecture rules, and contribution guidelines for the Stellar Hackathons & Events Platform backend.

## Tech Stack

* Framework: NestJS (TypeScript)
* Database: MongoDB (Mongoose)
* Auth: OAuth2 (GitHub, Google, etc)
* API Style: REST 
* Validation: class-validator
* Testing: Jest
* Linting/Formatting: ESLint + Prettier

## Core Principles

### 1. Modular Architecture

* Each domain must be isolated in its own module
* No cross-module direct DB access
* Communicate via services and DTOs

### 2. Separation of Concerns

* Controllers: HTTP layer only
* Services: Business logic only
* Repositories/Models: Data access only
* Guards/Interceptors/Middleware: Cross-cutting concerns

### 3. Testability

* Every service must be unit-testable
* External dependencies must be injectable
* Avoid static/global state

### 4. Explicit Domain Boundaries

Core domains:

* Auth
* Users
* Profiles
* Events
* Hackathons
* Registrations
* Admin / Moderation
* Swag (future)

Each domain:

* Owns its schemas
* Owns its DTOs
* Owns its services

### 5. Approval & Moderation Flow

* Event/Hackathon creation is always PENDING by default
* Admin must approve before public visibility
* Status transitions must be explicit and auditable

### 6. Data Integrity

* Use enums for statuses
* Validate all input with DTOs
* Never trust OAuth profile data blindly

### 7. Observability

* Centralized logging
* Request IDs
* Structured logs

### 8. Security

* OAuth tokens never stored in plaintext
* RBAC for admin actions
* Rate limiting on public endpoints

---

# High-Level Domains

## Auth

Responsibilities:

* OAuth login
* Token issuance
* Session management

## Users

Responsibilities:

* Core user entity
* Roles (USER, ORGANIZER, ADMIN)

## Profiles

Responsibilities:

* Developer profile
* Social links
* Stellar address

## Events

Responsibilities:

* Non-hackathon ecosystem events
* Approval flow

## Hackathons

Responsibilities:

* Hackathon-specific entities
* Registration rules
* Timelines

## Registrations

Responsibilities:

* User registrations to events/hackathons
* Status tracking

## Admin

Responsibilities:

* Approvals
* Moderation
* Platform management

---

# Status Enums (Example)

* DRAFT
* PENDING_APPROVAL
* APPROVED
* REJECTED
* ARCHIVED

---

# Directory Structure (Recommended)

src/
├── main.ts
├── app.module.ts
├── config/
│   ├── env.validation.ts
│   ├── mongo.config.ts
│   └── oauth.config.ts
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   ├── pipes/
│   ├── enums/
│   ├── constants/
│   └── utils/
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   ├── github.strategy.ts
│   │   │   └── google.strategy.ts
│   │   ├── dto/
│   │   └── tests/
│   │
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── schemas/user.schema.ts
│   │   ├── dto/
│   │   └── tests/
│   │
│   ├── profiles/
│   │   ├── profiles.controller.ts
│   │   ├── profiles.service.ts
│   │   ├── profiles.module.ts
│   │   ├── schemas/profile.schema.ts
│   │   ├── dto/
│   │   └── tests/
│   │
│   ├── events/
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   ├── events.module.ts
│   │   ├── schemas/event.schema.ts
│   │   ├── dto/
│   │   ├── enums/event-status.enum.ts
│   │   └── tests/
│   │
│   ├── hackathons/
│   │   ├── hackathons.controller.ts
│   │   ├── hackathons.service.ts
│   │   ├── hackathons.module.ts
│   │   ├── schemas/hackathon.schema.ts
│   │   ├── dto/
│   │   ├── enums/hackathon-status.enum.ts
│   │   └── tests/
│   │
│   ├── registrations/
│   │   ├── registrations.controller.ts
│   │   ├── registrations.service.ts
│   │   ├── registrations.module.ts
│   │   ├── schemas/registration.schema.ts
│   │   ├── dto/
│   │   └── tests/
│   │
│   ├── admin/
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   ├── admin.module.ts
│   │   ├── dto/
│   │   └── tests/
│   │
│   └── swag/  # future
│       └── README.md
│
├── database/
│   ├── mongo.module.ts
│   └── migrations/
│
├── health/
│   ├── health.controller.ts
│   └── health.module.ts
│
├── docs/
│   ├── api.md
│   ├── approval-flow.md
│   └── rbac.md
│
└── test/
├── e2e/
└── utils/

---

# Naming Conventions

* DTOs: CreateEventDto, UpdateHackathonDto
* Schemas: event.schema.ts
* Enums: *.enum.ts
* Services: Single responsibility

---

# Example Approval Flow

1. Organizer creates Hackathon
2. Status = PENDING_APPROVAL
3. Admin reviews
4. Admin sets APPROVED or REJECTED
5. Only APPROVED is publicly visible

---

# Non-Goals

* No cross-ecosystem events (only Stellar)
* No anonymous creation

---

# Folder Context Rules (context.md)

Every domain/module folder MUST contain a `context.md` file.

## Purpose

* `context.md` is the source of truth for that folder
* It explains:

  * Responsibilities
  * Public interfaces
  * Invariants
  * Dependencies on other modules

## Rule of Exploration (Mandatory)

* Any engineer or AI agent MUST read `context.md` before:

  * Modifying code in that folder
  * Adding new files
  * Refactoring logic

## Rule of Modification (Mandatory)

* If any code in a folder is changed, the corresponding `context.md` MUST be updated to reflect:

  * New responsibilities
  * Changed APIs
  * New invariants or assumptions
  * Deprecated behavior

## Enforcement

* PRs without updated `context.md` (when applicable) should be rejected
* Code reviewers must verify `context.md` accuracy

---

# Philosophy

This backend is a long-term ecosystem primitive for Stellar.
Design for:

* Clarity over cleverness
* Strong domain modeling
* Clean audit trails
* Future integrations (Colosseum, Stellar Dev tools, etc)


### RULES 

## Rule of plans

Plans should be human readable high level docs containing all the nitty gritties about how the work will be done but not the code, no pointers. Be as expressive as u can while planning but with words not with code .


## Rule of Package Manager

Our package  wil be mantained by the bun intrinsically

## Rule of build 

Anyone is not allowed to run build .

## Rule of paths

PAths shall now look like ../../../service 
but shall look like @/src/module/service for clear readability This will enhance our code readability a lot.