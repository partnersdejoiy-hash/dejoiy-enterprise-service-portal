import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/server/auth";
import { hasPermission, AppRole } from "@/lib/rbac";
import { createAuditLog } from "@/lib/audit";

const createLearningArticleSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(20).max(50000),
  published: z.boolean().optional(),
});

const updateLearningArticleSchema = z.object({
  articleId: z.string().uuid(),
  data: z.object({
    title: z.string().min(3).max(200).optional(),
    slug: z
      .string()
      .min(3)
      .max(200)
      .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
      .optional(),
    excerpt: z.string().max(500).optional().nullable(),
    content: z.string().min(20).max(50000).optional(),
    published: z.boolean().optional(),
  }),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;
    const canManageLearning = hasPermission(role, "learning:manage");
    const searchParams = req.nextUrl.searchParams;
    const published = searchParams.get("published");
    const q = searchParams.get("q");

    const whereClause: Record<string, unknown> = {};

    if (!canManageLearning) {
      whereClause.published = true;
    } else if (published !== null) {
      whereClause.published = published === "true";
    }

    if (q) {
      whereClause.OR = [
        {
          title: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          excerpt: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          content: {
            contains: q,
            mode: "insensitive",
          },
        },
      ];
    }

    const articles = await prisma.learningArticle.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("Get learning articles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning articles" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "learning:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createLearningArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.learningArticle.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An article with this slug already exists" },
        { status: 409 }
      );
    }

    const article = await prisma.learningArticle.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt ?? null,
        content: parsed.data.content,
        published: parsed.data.published ?? false,
        authorId: session.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "LEARNING_ARTICLE_CREATED",
      entityType: "LearningArticle",
      entityId: article.id,
      metadata: {
        title: article.title,
        slug: article.slug,
        published: article.published,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Create learning article error:", error);
    return NextResponse.json(
      { error: "Failed to create learning article" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.role as AppRole;

    if (!hasPermission(role, "learning:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateLearningArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existing = await prisma.learningArticle.findUnique({
      where: { id: parsed.data.articleId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Learning article not found" },
        { status: 404 }
      );
    }

    if (
      parsed.data.data.slug &&
      parsed.data.data.slug !== existing.slug
    ) {
      const slugTaken = await prisma.learningArticle.findUnique({
        where: { slug: parsed.data.data.slug },
      });

      if (slugTaken) {
        return NextResponse.json(
          { error: "Another article already uses this slug" },
          { status: 409 }
        );
      }
    }

    const article = await prisma.learningArticle.update({
      where: { id: parsed.data.articleId },
      data: {
        title: parsed.data.data.title ?? undefined,
        slug: parsed.data.data.slug ?? undefined,
        excerpt:
          parsed.data.data.excerpt !== undefined
            ? parsed.data.data.excerpt
            : undefined,
        content: parsed.data.data.content ?? undefined,
        published:
          parsed.data.data.published !== undefined
            ? parsed.data.data.published
            : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await createAuditLog({
      userId: session.id,
      action: "LEARNING_ARTICLE_UPDATED",
      entityType: "LearningArticle",
      entityId: article.id,
      metadata: {
        previousTitle: existing.title,
        newTitle: article.title,
        previousSlug: existing.slug,
        newSlug: article.slug,
        previousPublished: existing.published,
        newPublished: article.published,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Update learning article error:", error);
    return NextResponse.json(
      { error: "Failed to update learning article" },
      { status: 500 }
    );
  }
}
