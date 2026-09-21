# Business module structure

This folder is reserved for business-domain modules.

## Shared layers
- core/ = common platform and auth/security base
- shared/ = shared accounting services and generic utilities
- app/ = app bootstrap and route registration

## Module order
1. medical
2. cloth
3. salon
4. restaurant
5. supermarket
6. banquet
7. gamezone
8. mobile
9. hardware-electrical

## Rules
- Shared accounting logic should remain in core/shared
- Module-specific logic should go here
- Hardware/electrical is the final module to integrate
- Keep route/controller/service/model separation inside each module

## Current migration approach
- We are creating new module files under this structure instead of deleting the legacy app files immediately.
- Each new module copies or adapts the logic from the stable old implementation, using the legacy code as the tested baseline.
- The old files remain active and safe during the migration because they have already been validated in production or in working app flows.
- New module files are then linked through compatibility wrappers so the app continues to function without downtime.
- Once a new module is verified, the old file can be retired later in a controlled cleanup stage.

## Compatibility pattern
- Legacy route/controller/model imports remain available during transition.
- New module routes and controllers become the implementation target.
- Compatibility files act as bridge layers: they point to the new modular logic while preserving the older tested API contract.
- This allows gradual migration without breaking the app.
