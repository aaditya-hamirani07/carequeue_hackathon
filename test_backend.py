# Backward-compatible entry point — delegates to tests/test_backend.py
# Run from repository root: python test_backend.py
import runpy, os
runpy.run_path(os.path.join(os.path.dirname(__file__), "tests", "test_backend.py"), run_name="__main__")
