Feature: Portal — Resources tab
  As a portal user
  I want a Resources tab with categorized documentation links
  So that I can quickly find processes and guides for my role

  Background:
    Given I am logged into the portal

  Scenario: Resources tab is visible in the sidebar
    Then I should see a "Resources" tab in the sidebar

  Scenario: Clicking Resources tab activates the panel
    When I click the Resources tab
    Then the Resources panel should be visible
    And the Tournaments panel should be hidden

  Scenario: Resources panel contains all four sections
    When I click the Resources tab
    Then I should see a "General" section in Resources
    And I should see a "Clubhouse Processes" section in Resources
    And I should see a "Greens Processes" section in Resources
    And I should see a "Farm Processes" section in Resources

  Scenario: Any resource links open in a new tab
    When I click the Resources tab
    Then all resource links should open in a new tab
