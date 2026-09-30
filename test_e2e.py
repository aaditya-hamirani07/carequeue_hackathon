# Backward-compatible entry point — delegates to tests/test_e2e.py
# Run from repository root: python test_e2e.py
import runpy, os
runpy.run_path(os.path.join(os.path.dirname(__file__), "tests", "test_e2e.py"), run_name="__main__")
