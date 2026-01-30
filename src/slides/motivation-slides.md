## Why Nix?

---

If we pin a pom.xml, are we guaranteed the same build a year from now?

---

- JDK version
- Vendor
- Maven/Gradle version
- OS libraries
- Plugins
- Network state

---

If we commit package-lock.json or yarn.lock, are installs guaranteed to be identical everywhere?

---

- What about Node itself?
- Native modules?
- node-gyp?
- libc / glibc?
- Python being present?
- System headers?

---

If we pin a Dockerfile, are we guaranteed the same image next month?

---

- FROM ubuntu:20.04
- apt-get update
- Package mirrors
- Base image rebuilds
- Network availability

---

### Bus factor check

Who here knows the exact sequence to get a new machine working?

---

If we can’t guarantee reproducible builds today, how much time do we spend compensating for that without realizing it?
