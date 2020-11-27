export interface ApiCreateUserRequest {
    /**
     * Email (username).
     */
    email: string;
    /**
     * Name.
     */
    name: string;
    /**
     * Password.
     */
    password: string;
    /**
     * Surname.
     */
    surname: string;
}
