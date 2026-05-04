Feature: Portal — admin actions
  As a portal admin
  I want to take actions on tournaments and egg orders
  So that I can manage the club's operations

  Background:
    Given I am logged into the portal

  # ── Egg Orders ──────────────────────────────────────────────────────────────

  Scenario: Marking an egg order as picked up removes it from the pending list
    Given I am viewing the Egg Orders tab showing pending orders
    When I mark "Dave Edwards" as picked up
    Then "Dave Edwards" should no longer appear in the pending list

  Scenario: Switching to "All" filter shows completed orders
    Given I am viewing the Egg Orders tab showing pending orders
    When I switch the egg orders filter to "All"
    Then I should see "Carol Davis" in the egg orders list

  # ── Tournament management ────────────────────────────────────────────────────

  Scenario: Creating a new tournament saves it to the database
    Given I am viewing the Tournaments tab
    When I create a tournament named "Test Shootout" on a future date with 16 slots
    Then "Test Shootout" should appear in the tournament list

  Scenario: Tournament form validation prevents saving without required fields
    Given I am viewing the Tournaments tab
    When I open the new tournament form and submit it empty
    Then I should see a form validation error

  Scenario: Viewing registrations shows confirmed teams and hides cancelled ones
    Given I am viewing the Tournaments tab
    When I click "View Registrations" for "Azalea Open"
    Then I should see "Team Eagle" in the registrations panel
    And I should see "Team Birdie" in the registrations panel
    And the registrations panel should show "3 teams registered"

  Scenario: Cancelling a tournament marks it as cancelled
    Given I am viewing the Tournaments tab
    When I create a tournament named "Temp Cancel Test" on a future date with 8 slots
    And I cancel the tournament "Temp Cancel Test"
    Then "Temp Cancel Test" should show as cancelled in the list
