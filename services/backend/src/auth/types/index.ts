export { AuthenticatedUser, JwtPayload } from '../jwt.strategy';
export { AuthResponse, UserWithoutPassword } from '../auth.service';

// Why?
// Centralize all auth-related types in one file for easier imports and better organization. This way, when other parts of the application (e.g. controllers, services, guards) need to use these types, they can simply import from this index file instead of having to know the specific files where each type is defined. It also makes it clearer that these types are all related to authentication.