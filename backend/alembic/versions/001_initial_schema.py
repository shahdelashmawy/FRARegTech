"""Initial database schema with all tables and pgvector support

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

VECTOR_DIM = 384  # paraphrase-multilingual-MiniLM-L12-v2


def upgrade() -> None:
    # Try to enable pgvector extension (optional — core tables work without it)
    conn = op.get_bind()
    pgvector_available = False
    try:
        conn.execute(sa.text("SAVEPOINT pgvector_check"))
        conn.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.execute(sa.text("RELEASE SAVEPOINT pgvector_check"))
        pgvector_available = True
    except Exception as e:
        import logging
        logging.getLogger("alembic").warning(
            f"pgvector extension not available, skipping vector columns: {e}"
        )
        conn.execute(sa.text("ROLLBACK TO SAVEPOINT pgvector_check"))

    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("whatsapp_number", sa.String(), nullable=True),
        sa.Column("preferred_language", sa.String(), nullable=True, server_default="en"),
        sa.Column("keywords", sa.JSON(), nullable=True),
        sa.Column("notification_email", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("notification_whatsapp", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("is_admin", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    # Create regulations table
    op.create_table(
        "regulations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title_en", sa.String(), nullable=True),
        sa.Column("title_ar", sa.String(), nullable=True),
        sa.Column("content_en", sa.Text(), nullable=True),
        sa.Column("content_ar", sa.Text(), nullable=True),
        sa.Column("summary_en", sa.Text(), nullable=True),
        sa.Column("summary_ar", sa.Text(), nullable=True),
        sa.Column("regulation_type", sa.String(), nullable=False),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("published_date", sa.Date(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("embedding", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_regulations_id"), "regulations", ["id"], unique=False)
    op.create_index(op.f("ix_regulations_regulation_type"), "regulations", ["regulation_type"], unique=False)
    op.create_index(op.f("ix_regulations_source_url"), "regulations", ["source_url"], unique=True)

    # Create documents table
    op.create_table(
        "documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("file_path", sa.String(), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("content_ar", sa.Text(), nullable=True),
        sa.Column("source_url", sa.String(), nullable=True),
        sa.Column("regulation_type", sa.String(), nullable=True),
        sa.Column("published_date", sa.Date(), nullable=True),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("processed", sa.Boolean(), nullable=True, server_default="false"),
        sa.Column("processing_error", sa.Text(), nullable=True),
        sa.Column("embedding", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_documents_id"), "documents", ["id"], unique=False)
    op.create_index(op.f("ix_documents_user_id"), "documents", ["user_id"], unique=False)

    # Create alerts table
    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("keywords", sa.JSON(), nullable=True),
        sa.Column("regulation_types", sa.JSON(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default="true"),
        sa.Column("last_triggered", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alerts_id"), "alerts", ["id"], unique=False)
    op.create_index(op.f("ix_alerts_user_id"), "alerts", ["user_id"], unique=False)

    # Create query_logs table
    op.create_table(
        "query_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("response_text", sa.Text(), nullable=True),
        sa.Column("relevant_regulations", sa.JSON(), nullable=True),
        sa.Column("language", sa.String(), nullable=True, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_query_logs_id"), "query_logs", ["id"], unique=False)
    op.create_index(op.f("ix_query_logs_user_id"), "query_logs", ["user_id"], unique=False)

    # If pgvector is available, alter embedding columns to vector type and add indexes
    if pgvector_available:
        try:
            conn.execute(sa.text(f"ALTER TABLE regulations ALTER COLUMN embedding TYPE vector({VECTOR_DIM}) USING NULL::vector({VECTOR_DIM})"))
            conn.execute(sa.text(f"ALTER TABLE documents ALTER COLUMN embedding TYPE vector({VECTOR_DIM}) USING NULL::vector({VECTOR_DIM})"))
            conn.execute(sa.text(
                f"CREATE INDEX IF NOT EXISTS regulations_embedding_idx "
                f"ON regulations USING ivfflat (embedding vector_cosine_ops) "
                f"WITH (lists = 100)"
            ))
            conn.execute(sa.text(
                f"CREATE INDEX IF NOT EXISTS documents_embedding_idx "
                f"ON documents USING ivfflat (embedding vector_cosine_ops) "
                f"WITH (lists = 100)"
            ))
        except Exception as e:
            import logging
            logging.getLogger("alembic").warning(f"Could not set vector column types: {e}")


def downgrade() -> None:
    op.drop_table("query_logs")
    op.drop_table("alerts")
    op.drop_table("documents")
    op.drop_table("regulations")
    op.drop_table("users")
