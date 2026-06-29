## Anti-Patterns

| Anti-Pattern                                   | Why                                        | Fix                                                                          |
| ---------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| Putting user files at a flat root path         | No access control per user                 | Organize under `users/{uid}/...`                                             |
| Not specifying `contentType` metadata          | Browser/client may misinterpret the file   | Always set `contentType` on upload                                           |
| Calling `getDownloadURL` on every read         | Extra network round-trip                   | Cache the URL after first fetch                                              |
| Using `getData()` for large files              | Loads entire file into memory              | Use `writeToFile()` for files > a few MB                                     |
| Not handling `object-not-found` on delete      | Throws if file was already removed         | Catch and ignore `object-not-found`                                          |
| Listing without pagination on large dirs       | `listAll()` fetches everything into memory | Use `list()` with `maxResults` and `pageToken`                               |
| Storing download URLs in Firestore without TTL | URLs can be revoked                        | Store the `fullPath` and fetch URL on demand, or regenerate after revocation |

---
