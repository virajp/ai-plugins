# gitleaks — secret scanning

**Two different scans, at two different moments.** The working tree is scanned
on every commit, which is what stops a credential entering history. History
itself is scanned **once**, deliberately, because it answers a different
question: what is already in there. Running the history scan on every commit
buys nothing and costs the gate its speed.

**A hit is a credential to rotate, not a line to delete.** This is the rule the
whole gate stands on. Once a secret has been committed it is disclosed — to
anyone with the clone, and to every backup of it. Removing the line makes the
scanner quiet and changes nothing about the exposure. Rotate first; clean the
tree second, if at all.

**Allowlist by fingerprint, never by rule.** A fingerprint silences one known
finding at one location. Disabling the rule that found it blinds the scanner
across the entire repository, including the file someone adds next week. The
narrower silence is the one that survives contact with a growing repo.

**Every allowlist entry carries why.** An unexplained fingerprint is
indistinguishable from a real secret somebody got tired of looking at.

**Wired as one task name**, and CI runs that same task. See the hook-runner
component for the parity rule this depends on.
