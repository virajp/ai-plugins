#!/bin/sh
# The pre-compact half of the MemPalace checkpoint hook.
#
# A separate file rather than an argument because `hooks.yaml` names a script
# and passes it nothing — the neutral schema has no `args`, and adding one
# would change four renderers to save three lines here.
exec "$(dirname "$0")/mempalace-checkpoint.sh" --compact
