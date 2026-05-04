Feature: Portal — core functionality
  As a portal admin
  I want the portal to load and display live data
  So that I can manage tournaments and egg orders

  Background:
    Given I am logged into the portal

  Scenario: Correct password grants access to the portal
    Then the app shell should be visible
    And the login screen should be hidden

  Scenario: Wrong password shows an error and stays on the login screen
    Given I am on the portal login screen
    When I submit the password "wrongpassword"
    Then I should see the error "Incorrect password."
    And the login screen should still be visible

  Scenario: Tournaments tab loads data from the database
    When I view the Tournaments tab
    Then I should see "Azalea Open" in the tournament list
    And I should see "Member-Guest Classic" in the tournament list

  Scenario: Cancelled tournament is shown with a cancelled badge
    When I view the Tournaments tab
    Then the tournament list should contain "Cancelled" for "Fall Invitational"

  Scenario: Registration count reflects confirmed registrations
    When I view the Tournaments tab
    Then "Azalea Open" should show "3" registrations

  Scenario: Egg orders tab loads pending orders from the database
    When I view the Egg Orders tab
    Then I should see "Alice Brown" in the egg orders list
    And I should see "Bob Carter" in the egg orders list

  Scenario: Completed egg orders are hidden by the pending filter
    When I view the Egg Orders tab
    Then I should not see "Carol Davis" in the egg orders list
