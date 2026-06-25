Feature: CRM — Contacts & Relationships
  As a portal admin
  I want to manage contacts, memberships, interactions, and event inquiries
  So that Cherrywood staff can track relationships with members and guests

  Background:
    Given I am logged into the portal

  Scenario: CRM tab is accessible and shows a contacts list or empty state
    When I click the CRM tab
    Then the CRM tab panel should be visible
    And the contacts list or empty state should be displayed

  Scenario: Add a new contact and see it in the list
    When I click the CRM tab
    And I click the "Add Contact" button in the CRM toolbar
    And I fill in the contact form with first name "Bertram" and last name "Holloway"
    And I submit the contact form
    Then "Bertram Holloway" should appear in the contacts list

  Scenario: View a contact's detail panel
    When I click the CRM tab
    And a contact named "Bertram Holloway" exists in the list
    And I click "View" for the contact "Bertram Holloway"
    Then the contact detail panel should be visible
    And the detail panel should show "Bertram Holloway"

  Scenario: Add an interaction to a contact
    When I click the CRM tab
    And a contact named "Bertram Holloway" exists in the list
    And I click "View" for the contact "Bertram Holloway"
    And I click "Add Interaction"
    And I fill in the interaction summary "Called to confirm membership interest"
    And I submit the interaction form
    Then the interaction "Called to confirm membership interest" should appear in the contact detail

  Scenario: Search for a contact by name
    When I click the CRM tab
    And a contact named "Bertram Holloway" exists in the list
    And I type "Bertram" in the CRM search box
    Then "Bertram Holloway" should appear in the contacts list
    And the list should not show unmatched contacts
