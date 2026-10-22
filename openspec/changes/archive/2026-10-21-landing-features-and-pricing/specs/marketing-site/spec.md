# Spec Delta

## ADDED Requirements

### Requirement: Pricing section before the FAQ
The home page SHALL show a pricing section under the `#precos` anchor, right before the FAQ. The
footer's "Preços" link SHALL scroll to it.

#### Scenario: Visitor scrolls toward the FAQ
- **WHEN** a visitor scrolls down to the FAQ on `/`
- **THEN** the pricing section with the heading "Quanto custa? Arraste e descubra." comes right before it

#### Scenario: Visitor uses the footer link
- **WHEN** a visitor activates "Preços" in the footer
- **THEN** the page scrolls to the pricing section

### Requirement: Usage sliders
The pricing section SHALL offer two sliders on a logarithmic scale: minutes watched per month,
from 1,000 to 1,000,000, and hours of video stored, from 10 to 10,000. They SHALL start at
120,000 minutes and 200 hours. Values SHALL snap to two significant figures and never leave
their range.

#### Scenario: Visitor opens the pricing section
- **WHEN** a visitor reaches the pricing section
- **THEN** the minutes slider shows "120 mil min" and the hours slider shows "200 h"

#### Scenario: Visitor drags past the ends
- **WHEN** a visitor drags the minutes slider beyond either end
- **THEN** the value stays at 1,000 or 1,000,000 minutes

#### Scenario: Value snaps to a round number
- **WHEN** a visitor moves the minutes slider to a position worth 123,456 minutes
- **THEN** the value shown is 120,000 minutes

### Requirement: Monthly estimate
The pricing section SHALL show a monthly estimate in reais: delivery for the minutes watched above
the free allowance, plus storage for the hours stored, each line rounded to whole reais. The
total SHALL equal the sum of the lines shown, and SHALL update as the sliders move.

#### Scenario: Default usage
- **WHEN** the sliders are at 120,000 minutes and 200 hours with the published prices
- **THEN** delivery shows R$ 595, storage shows R$ 120, the free allowance shows R$ 0 and the total shows R$ 715 per month

#### Scenario: Usage below the free allowance
- **WHEN** the minutes slider is at 1,000 minutes
- **THEN** delivery shows R$ 0
- **AND** the total equals the storage line

#### Scenario: Maximum usage
- **WHEN** both sliders are at their maximum
- **THEN** the total shows R$ 10.995 per month

### Requirement: Cost per student
The estimate SHALL show the cost per student, assuming each student watches 8 hours (480 minutes)
per month. The student count is the minutes watched divided by 480, rounded down, and never less
than one. The cost per student is the total divided by that count, shown with cents.

#### Scenario: Default usage
- **WHEN** the sliders are at 120,000 minutes and 200 hours
- **THEN** the estimate shows "≈ R$ 2,86 por aluno por mês"

#### Scenario: Fewer minutes than one student watches
- **WHEN** the minutes slider is at 1,000 minutes and the hours slider at 10 hours
- **THEN** the student count is 2 and the estimate shows "≈ R$ 3,00 por aluno por mês"

### Requirement: Playful usage hints
Each slider SHALL show a hint that turns its value into something concrete: the minutes slider
shows how many students watching 8 hours per month it equals, and the hours slider shows how many
8-hour courses it equals. Counts SHALL be whole numbers, never below one, with singular wording
for one.

#### Scenario: Default usage
- **WHEN** the sliders are at 120,000 minutes and 200 hours
- **THEN** the hints read "≈ 250 alunos assistindo 8 h por mês" and "≈ 25 cursos de 8 horas"

#### Scenario: Hours below one course
- **WHEN** the hours slider is at 10 hours
- **THEN** the hint reads "≈ 1 curso de 8 horas"

### Requirement: One source for published prices
The prices per minute and per stored hour, the free allowance and the hours per student SHALL come
from one setting. The breakdown, the estimate and any price shown on the page SHALL use it.

#### Scenario: A price changes
- **WHEN** the price per minute is changed in that setting and the site is rebuilt
- **THEN** the breakdown, the total and the cost per student shown on the page all use the new price

#### Scenario: Free allowance changes
- **WHEN** the free allowance is changed to 2,000 minutes and the site is rebuilt
- **THEN** the breakdown labels the allowance as 2.000 minutes and delivery starts after 2,000 minutes

### Requirement: Accessible pricing calculator
Both sliders SHALL be usable with the keyboard and SHALL expose their current value as text to
assistive technology. The monthly total SHALL be announced politely when it changes. The mascot
thumbs are decorative.

#### Scenario: Keyboard user adjusts a slider
- **WHEN** a keyboard user focuses the minutes slider and presses the right arrow key
- **THEN** the value moves one step up
- **AND** Home and End move it to 1,000 and 1,000,000 minutes

#### Scenario: Screen reader reads a slider
- **WHEN** a screen reader user focuses the hours slider at 200 hours
- **THEN** it announces the slider's label and "200 horas guardadas"

### Requirement: Pricing calculator without JavaScript
With JavaScript disabled, the pricing section SHALL still show the default estimate, its breakdown
and the calls to action, and SHALL NOT present sliders that do not work.

#### Scenario: Visitor has JavaScript disabled
- **WHEN** a visitor with JavaScript disabled reaches the pricing section
- **THEN** the estimate for 120,000 minutes and 200 hours (R$ 715 per month) is shown with its breakdown
- **AND** the sliders are shown disabled at their default values
- **AND** the primary call to action works
