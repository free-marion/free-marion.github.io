Feature: Public-facing forms
  As a member of the public
  I want to reserve eggs and register for tournaments
  So that I can participate in Cherrywood events

  # ── Egg reservation form (index.html) ───────────────────────────────────────

  Scenario: Submitting a valid egg order shows a success message
    Given I am on the main site
    When I fill out the egg reservation form with valid details
    Then I should see the egg success message
    And a new egg order should exist in the database

  Scenario: Submitting the egg form without a name shows a browser validation error
    Given I am on the main site
    When I submit the egg form without filling in my name
    Then the form should not submit

  # ── Tournament events page (events.html) ────────────────────────────────────

  Scenario: Upcoming open tournaments appear in the events list
    Given I am on the events page
    Then I should see "Azalea Open" in the upcoming events list
    And I should see "Member-Guest Classic" in the upcoming events list

  Scenario: Cancelled tournaments do not appear in the upcoming events list
    Given I am on the events page
    Then I should not see "Fall Invitational" in the upcoming events list

  Scenario: An open tournament shows a Register button when selected
    Given I am on the events page
    When I click the "Azalea Open" event card
    Then I should see a "Register for this Event" button in the detail panel

  Scenario: Submitting a valid team registration saves it to the database
    Given I am on the events page
    When I register for "Azalea Open" with team name "Test Team Alpha" and captain "Jane Doe"
    Then I should see a registration success message
    And "Test Team Alpha" should be registered in the database
