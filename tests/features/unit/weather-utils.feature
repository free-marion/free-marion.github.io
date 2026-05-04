Feature: Weather utility functions
  As a site component
  I want accurate weather data formatting
  So that visitors see correct wind direction and condition labels

  # ── degreesToCompass ─────────────────────────────────────────────────────────

  Scenario Outline: Wind degrees map to compass directions
    When I convert <degrees> degrees to a compass direction
    Then I should get "<direction>"

    Examples:
      | degrees | direction |
      | 0       | N         |
      | 360     | N         |
      | 22      | NNE       |
      | 45      | NE        |
      | 90      | E         |
      | 135     | SE        |
      | 180     | S         |
      | 225     | SW        |
      | 270     | W         |
      | 315     | NW        |
      | 337     | NNW       |

  # ── wmoDescription ───────────────────────────────────────────────────────────

  Scenario Outline: WMO weather codes map to descriptions
    When I look up WMO code <code>
    Then the description should be "<description>"

    Examples:
      | code | description         |
      | 0    | Clear Sky           |
      | 3    | Overcast            |
      | 61   | Light Rain          |
      | 95   | Thunderstorm        |
      | 999  | Unknown             |
