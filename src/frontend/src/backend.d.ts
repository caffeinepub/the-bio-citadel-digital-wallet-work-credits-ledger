import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AdminUserDisplay {
    principal: Principal;
    name: string;
}
export type TransactionId = bigint;
export type Time = bigint;
export type WalletBalance = bigint;
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: TransactionId;
    admin: Principal;
    transactionType: TransactionType;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
    amount: bigint;
}
export enum TransactionType {
    mint = "mint",
    transfer = "transfer"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllRegisteredUsersWithNames(): Promise<Array<AdminUserDisplay>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTransactionHistory(user: Principal | null): Promise<Array<Transaction>>;
    getTransactionLedger(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletBalance(user: Principal | null): Promise<WalletBalance>;
    getWalletDetailsWithPrincipal(_principal: Principal): Promise<UserProfile>;
    isCallerAdmin(): Promise<boolean>;
    mintCredits(recipient: Principal, amount: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    transferCredits(recipient: Principal, amount: bigint): Promise<void>;
}
