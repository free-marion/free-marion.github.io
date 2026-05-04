Feature: Tee time slot generation
  As the Cherrywood booking system
  I want to generate the correct set of available tee time slots for a given date
  So that golfers can only see and book valid times

  Scenario: Weekend slots open at 8:00 AM
    Given a Saturday in the future
    When I generate tee time slots for that date
    Then the first slot should start at 8 AM

  Scenario: Weekday slots open at 9:00 AM
    Given a Monday in the future
    When I generate tee time slots for that date
    Then the first slot should start at 9 AM

  Scenario: Slots are spaced 10 minutes apart
    Given a Wednesday in the future
    When I generate tee time slots for that date
    Then consecutive slots should be exactly 10 minutes apart

  Scenario: A known Saturday is identified as a weekend
    Given the date string "2026-05-09"
    When I check if it falls on a weekend
    Then the result should be true

  Scenario: A known Wednesday is identified as a weekday
    Given the date string "2026-05-13"
    When I check if it falls on a weekend
    Then the result should be false

  Scenario: Confirmation numbers are in the expected format
    When I generate a confirmation number
    Then it should match the pattern "CW-NNNN"
