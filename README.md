\# DEJOIY Enterprise Service Portal



DEJOIY Enterprise Service Portal is a modern internal enterprise platform built for:



\- IT support ticketing

\- HR document workflows

\- Employment verification

\- Background verification

\- Learning center / knowledge hub

\- User and admin management



It is implemented as a \*\*Next.js App Router application\*\* with Prisma, PostgreSQL, Redis, RabbitMQ-ready event abstraction, S3 uploads, and enterprise RBAC.



\---



\## Monorepo Structure



```bash

.

├── apps/

│   └── web/

│       ├── app/

│       ├── components/

│       ├── lib/

│       ├── prisma/

│       └── ...

└── infra/

&#x20;   └── docker-compose.yml

