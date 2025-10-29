#!/bin/sh

TIMEOUT=60
QUIET=0

usage() {
  exitcode="$1"
  cat << USAGE >&2
Usage: $0 host:port [-t timeout] [-- command args]
  -q | --quiet                        Don't output any status messages
  -t TIMEOUT | --timeout=TIMEOUT      Timeout in seconds (default: $TIMEOUT)
  -- COMMAND ARGS                     Execute command with args after the service is available
USAGE
  exit "$exitcode"
}

wait_for() {
  local HOSTPORT=(${1//:/ })
  local HOST=${HOSTPORT[0]}
  local PORT=${HOSTPORT[1]}
  local start_ts=$(date +%s)
  local wait_time=0

  if [[ "$QUIET" -ne 1 ]]; then
    echo "Waiting for $HOST:$PORT..."
  fi
  
  while :; do
    if nc -z "$HOST" "$PORT" > /dev/null 2>&1; then
      if [[ "$QUIET" -ne 1 ]]; then
        echo "âœ“ $HOST:$PORT is available after $wait_time seconds"
      fi
      return 0
    fi

    wait_time=$(($(date +%s) - start_ts))
    
    if [[ $wait_time -gt $TIMEOUT ]]; then
      echo "âœ— Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT" >&2
      return 1
    fi

    if [[ "$QUIET" -ne 1 ]]; then
      echo -n "."
    fi
    sleep 1
  done
}

# Process arguments
while [[ $# -gt 0 ]]
do
  case "$1" in
    *:* )
    hostport=$1
    shift 1
    ;;
    -q | --quiet)
    QUIET=1
    shift 1
    ;;
    -t)
    TIMEOUT="$2"
    if [[ -z "$TIMEOUT" ]]; then break; fi
    shift 2
    ;;
    --timeout=*)
    TIMEOUT="${1#*=}"
    shift 1
    ;;
    --)
    shift
    CLI=("$@")
    break
    ;;
    --help)
    usage 0
    ;;
    *)
    echo "Unknown argument: $1"
    usage 1
    ;;
  esac
done

if [[ "$CLI" ]]; then
  if wait_for "$hostport"; then
    if [[ "$QUIET" -ne 1 ]]; then
      echo "âœ“ Starting: ${CLI[*]}"
    fi
    exec "${CLI[@]}"
  else
    exit 1
  fi
else
  if ! wait_for "$hostport"; then
    exit 1
  fi
fi
