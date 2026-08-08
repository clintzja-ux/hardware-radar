# Install IC-PLATFORM-001

1. Extract this package separately.
2. Copy the contents of the enclosed `hardware-radar` directory over the root
   of the active `platform-sprint1-repository-modernization` repository.
3. Run `npm run build:public`. This regenerates Atlas, Mercury, and Forge
   deployment artifacts and removes the obsolete public Sentinel/test copies.
4. Run `npm test`.
5. Verify Forge and the Hardware Radar pages locally before committing.

Do not delete the destination repository before copying. Existing documentation
not included in this patch remains untouched.
