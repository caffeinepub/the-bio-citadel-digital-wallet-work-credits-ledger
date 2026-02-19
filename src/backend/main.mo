import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Order "mo:core/Order";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type WalletBalance = Nat;
  type TransactionId = Nat;

  public type UserProfile = {
    name : Text;
  };

  type Transaction = {
    id : TransactionId;
    timestamp : Time.Time;
    admin : Principal;
    sender : Principal;
    recipient : Principal;
    transactionType : TransactionType;
    amount : Nat;
  };

  type TransactionType = {
    #mint;
    #transfer;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.id, t2.id);
    };
  };

  type Wallet = {
    balance : WalletBalance;
    transactions : List.List<Transaction>;
  };

  // Display type for users in admin dashboard
  public type AdminUserDisplay = {
    principal : Principal;
    name : Text;
  };

  // Storage
  let wallets = Map.empty<Principal, Wallet>();
  let transactions = Map.empty<TransactionId, Transaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextTransactionId = 1;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);

    // Check if wallet exists, initialize if not
    if (not wallets.containsKey(caller)) {
      let newWallet : Wallet = {
        balance = 0;
        transactions = List.empty<Transaction>();
      };
      wallets.add(caller, newWallet);
    };
  };

  // Wallet & Credits Management

  // Mint credits (Admin Only)
  public shared ({ caller }) func mintCredits(recipient : Principal, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can mint credits");
    };

    let transaction : Transaction = {
      id = nextTransactionId;
      timestamp = Time.now();
      admin = caller;
      sender = recipient;
      recipient;
      amount;
      transactionType = #mint;
    };

    // Update recipient wallet
    let recipientWallet = switch (wallets.get(recipient)) {
      case (null) {
        {
          balance = 0;
          transactions = List.empty<Transaction>();
        };
      };
      case (?wallet) { wallet };
    };

    let newBalance = recipientWallet.balance + amount;
    let newTransactions = recipientWallet.transactions;

    newTransactions.add(transaction);

    let newWallet : Wallet = {
      balance = newBalance;
      transactions = newTransactions;
    };

    wallets.add(recipient, newWallet);

    // Record transaction
    transactions.add(nextTransactionId, transaction);
    nextTransactionId += 1;
  };

  // Transfer credits (User to User)
  public shared ({ caller }) func transferCredits(recipient : Principal, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can transfer credits");
    };

    // Prevent self-transfer
    if (caller == recipient) {
      Runtime.trap("Cannot transfer credits to yourself");
    };

    // Check if sender has enough balance
    if (not wallets.containsKey(caller)) {
      Runtime.trap("Sender wallet does not exist");
    };

    let senderWallet = switch (wallets.get(caller)) {
      case (null) { Runtime.trap("Sender wallet does not exist") };
      case (?wallet) { wallet };
    };

    if (senderWallet.balance < amount) {
      Runtime.trap("Insufficient balance");
    };

    // Validate recipient wallet exists
    if (not wallets.containsKey(recipient)) {
      Runtime.trap("Recipient wallet does not exist");
    };

    let recipientWallet = switch (wallets.get(recipient)) {
      case (null) { Runtime.trap("Recipient wallet does not exist") };
      case (?wallet) { wallet };
    };

    // Validate amount is greater than zero
    if (amount == 0) {
      Runtime.trap("Transfer amount must be greater than zero");
    };

    let transaction : Transaction = {
      id = nextTransactionId;
      timestamp = Time.now();
      admin = caller;
      sender = caller;
      recipient;
      amount;
      transactionType = #transfer;
    };

    // Update sender wallet - deduct balance and add transaction
    let updatedSenderTransactions = senderWallet.transactions;
    updatedSenderTransactions.add(transaction);

    let updatedSenderWallet : Wallet = {
      balance = senderWallet.balance - amount;
      transactions = updatedSenderTransactions;
    };

    wallets.add(caller, updatedSenderWallet);

    // Update recipient wallet - add balance and add transaction
    let updatedRecipientTransactions = recipientWallet.transactions;
    updatedRecipientTransactions.add(transaction);

    let updatedRecipientWallet : Wallet = {
      balance = recipientWallet.balance + amount;
      transactions = updatedRecipientTransactions;
    };

    wallets.add(recipient, updatedRecipientWallet);

    // Record transaction in public ledger
    transactions.add(nextTransactionId, transaction);
    nextTransactionId += 1;
  };

  // Get wallet balance - users can view their own, admins can view any
  public query ({ caller }) func getWalletBalance(user : ?Principal) : async WalletBalance {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };

    let targetUser = switch (user) {
      case (null) { caller };
      case (?u) { u };
    };

    // Users can only view their own balance, admins can view any
    if (targetUser != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own wallet balance");
    };

    switch (wallets.get(targetUser)) {
      case (null) { 0 };
      case (?wallet) { wallet.balance };
    };
  };

  // Get transaction history - users can view their own, admins can view any
  public query ({ caller }) func getTransactionHistory(user : ?Principal) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };

    let targetUser = switch (user) {
      case (null) { caller };
      case (?u) { u };
    };

    // Users can only view their own history, admins can view any
    if (targetUser != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transaction history");
    };

    switch (wallets.get(targetUser)) {
      case (null) { [] };
      case (?wallet) {
        wallet.transactions.toArray();
      };
    };
  };

  // Admin-only: Get all users with full names for dropdown display
  public query ({ caller }) func getAllRegisteredUsersWithNames() : async [AdminUserDisplay] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };

    let results = List.empty<AdminUserDisplay>();

    for ((principal, _) in wallets.entries()) {
      let name = switch (userProfiles.get(principal)) {
        case (null) { "Unknown" };
        case (?profile) { profile.name };
      };
      results.add({
        principal;
        name;
      });
    };

    results.toArray();
  };

  // Admin-only: Get user details for wallet including principal and full name
  public query ({ caller }) func getWalletDetailsWithPrincipal(_principal : Principal) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view wallet details");
    };

    switch (userProfiles.get(_principal)) {
      case (null) {
        Runtime.trap("User profile not found for principal " # _principal.toText());
      };
      case (?profile) {
        profile;
      };
    };
  };

  // Public transaction ledger - intentionally accessible to all (including guests)
  public query func getTransactionLedger() : async [Transaction] {
    // No authorization check - publicly viewable per specification
    let txArray = transactions.values().toArray();
    txArray.sort();
  };
};
