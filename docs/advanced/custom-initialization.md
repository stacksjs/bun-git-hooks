# Custom Initialization

bun-git-hooks supports custom initialization scripts and environment setup through various mechanisms.

## RC File

### Basic Setup

Create a `.git-hooks.rc` file in your project root:

```bash
#!/bin/sh

# Set environment variables
export NODE_ENV=development
export PATH="$PATH:./node_modules/.bin"

# Load project-specific configuration
if [ -f ".env.local" ]; then
  source .env.local
fi

# Custom initialization logic
initialize_project() {
  echo "Initializing project environment..."
  bun install
}

initialize_project
```

### Configuration

The RC file is loaded before any hook execution. You can specify a custom location:

```bash
export BUN_GIT_HOOKS_RC=/path/to/custom/init.sh
```

## Advanced Configuration

### Environment-specific Setup

```bash
#!/bin/sh

# Load different configurations based on environment
case "$NODE_ENV" in
  "production")
    source .env.production
    export STRICT_MODE=1
    ;;
  "staging")
    source .env.staging
    ;;
  *)
    source .env.development
    ;;
esac

# Set up path for project-specific tools
export PATH="$PWD/tools/bin:$PATH"
```

### Team Configuration

Create a shared initialization template:

```bash
#!/bin/sh

# Team-wide configuration
export TEAM_CONFIG=/path/to/team/config
export CODE_STYLE_CONFIG=/path/to/style/guide

# Load team tools
if [ -d "$TEAM_CONFIG/tools" ]; then
  export PATH="$TEAM_CONFIG/tools:$PATH"
fi

# Project-specific overrides
if [ -f ".git-hooks.local.rc" ]; then
  source .git-hooks.local.rc
fi
```

## Best Practices

1. **Keep It Fast**: Initialization runs before every hook
2. **Use Environment Variables**: For flexible configuration
3. **Local Overrides**: Support developer-specific settings
4. **Error Handling**: Add proper error checks

## Examples

### Development Tools Setup

```bash
#!/bin/sh

# Ensure development tools are available
check_tools() {
  command -v eslint >/dev/null 2>&1 || {
    echo "Installing eslint..."
    bun add -D eslint
  }

  command -v prettier >/dev/null 2>&1 || {
    echo "Installing prettier..."
    bun add -D prettier
  }
}

# Set up Git configuration
setup_git() {
  git config core.autocrlf false
  git config core.ignorecase false
}

# Initialize development environment
init_dev_env() {
  check_tools
  setup_git

  # Load custom paths
  export PATH="$PWD/scripts:$PATH"
}

init_dev_env
```

### Project-specific Configuration

```bash
#!/bin/sh

# Project configuration
export PROJECT_ROOT="$PWD"
export CONFIG_PATH="$PROJECT_ROOT/config"
export SCRIPTS_PATH="$PROJECT_ROOT/scripts"

# Add project bins to PATH
export PATH="$SCRIPTS_PATH/bin:$PATH"

# Load environment-specific settings
if [ -f "$CONFIG_PATH/env.$NODE_ENV.sh" ]; then
  source "$CONFIG_PATH/env.$NODE_ENV.sh"
fi

# Initialize services
init_services() {
  # Start development services if needed
  if [ "$NODE_ENV" = "development" ]; then
    echo "Starting development services..."
    bun run dev:services
  fi
}

init_services
```
