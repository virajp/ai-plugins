#!/bin/sh
# The pre-compact half of the MemPalace checkpoint hook.
#
# A separate file rather than an argument. This began as a constraint of the
# retired neutral hook schema, which named a script and passed it nothing; with
# hooks authored directly as hooks.json an argument is now expressible, so this
# is merely how it is. Collapsing the two entries into one would be a fine
# simplification — cli/src/mempalace-checkpoint-script.test.ts covers the
# behaviour either way.
exec "$(dirname "$0")/mempalace-checkpoint.sh" --compact
