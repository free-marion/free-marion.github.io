Feature: Event display utility functions
  As a site component
  I want accurate urgency classification and slot labels
  So that visitors see correct availability information on tournament cards

  # ── urgencyClass ─────────────────────────────────────────────────────────────

  Scenario: A cancelled tournament is always classified as cancelled
    Given a tournament with status "cancelled" and 10 max slots and 0 registered
    When I compute the urgency class for a future date
    Then the urgency class should be "cancelled"

  Scenario: A past open tournament is classified as past
    Given a tournament with status "open" and 10 max slots and 0 registered
    When I compute the urgency class for a past date
    Then the urgency class should be "past"

  Scenario: A sold out tournament is classified as soldout
    Given a tournament with status "open" and 10 max slots and 10 registered
    When I compute the urgency class for a future date
    Then the urgency class should be "soldout"

  Scenario: A tournament with 2 spots left is classified as critical
    Given a tournament with status "open" and 10 max slots and 8 registered
    When I compute the urgency class for a future date
    Then the urgency class should be "critical"

  Scenario: A tournament with 5 spots left is classified as low
    Given a tournament with status "open" and 10 max slots and 5 registered
    When I compute the urgency class for a future date
    Then the urgency class should be "low"

  Scenario: A tournament with plenty of spots is classified as open
    Given a tournament with status "open" and 20 max slots and 5 registered
    When I compute the urgency class for a future date
    Then the urgency class should be "open"

  Scenario: A tournament with no max slots set shows open regardless of count
    Given a tournament with status "open" and 0 max slots and 99 registered
    When I compute the urgency class for a future date
    Then the urgency class should be "open"

  # ── slotsLabel ───────────────────────────────────────────────────────────────

  Scenario: Sold out label
    Given a tournament with status "open" and 10 max slots and 10 registered
    Then the slots label for urgency "soldout" should be "Sold Out"

  Scenario: Cancelled label
    Given a tournament with status "cancelled" and 10 max slots and 0 registered
    Then the slots label for urgency "cancelled" should be "Cancelled"

  Scenario: Critical label shows remaining count
    Given a tournament with status "open" and 10 max slots and 8 registered
    Then the slots label for urgency "critical" should contain "2"

  Scenario: Low label shows remaining count
    Given a tournament with status "open" and 10 max slots and 6 registered
    Then the slots label for urgency "low" should contain "4"

  Scenario: Open label shows remaining of total
    Given a tournament with status "open" and 20 max slots and 5 registered
    Then the slots label for urgency "open" should be "15 of 20 spots open"

  Scenario: No max slots shows total registered count
    Given a tournament with status "open" and 0 max slots and 7 registered
    Then the slots label for urgency "open" should be "7 registered"
