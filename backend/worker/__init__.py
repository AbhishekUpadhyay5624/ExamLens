"""Background worker package.

- ``runner``     : in-process ThreadPoolExecutor (default runtime)
- ``celery_app`` : Celery application (opt-in via USE_CELERY=1)
- ``tasks``      : Celery task
- ``processing`` : shared job body (sync PyMongo) used by both runtimes
"""
