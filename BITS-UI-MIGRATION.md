# Bits UI Migration Guide

## Available Bits UI Components

Bits UI provides 30+ headless components that can replace custom implementations:

### Form & Input Components
- **Button** → Replace custom button implementations
- **Checkbox** → For multi-select options
- **Radio Group** → For single-select options (quiz questions)
- **Select** → Dropdown menus
- **Switch** → Toggle settings
- **Slider** → Range inputs (preference scores)
- **Rating Group** → Star ratings
- **Combobox** → Searchable dropdowns
- **Pin Input** → For session codes
- **Toggle/Toggle Group** → For multi-state buttons

### Layout & Container Components
- **Dialog** → Replace modals
- **Popover** → Tooltips and info bubbles
- **Dropdown Menu** → Context menus
- **Context Menu** → Right-click menus
- **Accordion** → Expandable sections
- **Tabs** → Tab navigation (analytics views)
- **Collapsible** → Show/hide sections
- **Separator** → Visual dividers

### Feedback Components
- **Alert Dialog** → Confirmation dialogs
- **Progress** → Loading bars
- **Tooltip** → Hover hints

### Data Display
- **Avatar** → User profile images
- **Pagination** → Data pagination
- **Scroll Area** → Custom scrollbars

### Date/Time
- **Calendar** → Date pickers
- **Date Picker** → Date selection
- **Date Range Picker** → Date range selection

## Migration Opportunities

### 1. Replace Custom Buttons
**Current**: Custom HTML buttons with Tailwind classes
**Migration**:
```svelte
import { Button } from 'bits-ui';

<Button.Root class="px-6 py-2 bg-gray-600 text-white rounded-lg">
  Click me
</Button.Root>
```

### 2. Replace Modals with Dialog
**Current**: Custom modal implementations
**Migration**:
```svelte
import { Dialog } from 'bits-ui';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Session Settings</Dialog.Title>
    </Dialog.Header>
    <!-- Content here -->
  </Dialog.Content>
</Dialog.Root>
```

### 3. Quiz Options with Radio Group
**Current**: Custom option selection
**Migration**:
```svelte
import { RadioGroup } from 'bits-ui';

<RadioGroup.Root bind:value={selectedOption}>
  {#each options as option}
    <RadioGroup.Item value={option.id}>
      <RadioGroup.ItemIndicator />
      {option.text}
    </RadioGroup.Item>
  {/each}
</RadioGroup.Root>
```

### 4. Settings with Switch
**Current**: Boolean toggles
**Migration**:
```svelte
import { Switch } from 'bits-ui';

<Switch.Root bind:checked={isActive}>
  <Switch.Thumb />
</Switch.Root>
```

### 5. Session Code with Pin Input
**Current**: Text input for codes
**Migration**:
```svelte
import { PinInput } from 'bits-ui';

<PinInput.Root>
  {#each Array(8) as _, i}
    <PinInput.Input index={i} />
  {/each}
</PinInput.Root>
```

### 6. Analytics Tabs
**Current**: Custom tab navigation
**Migration**:
```svelte
import { Tabs } from 'bits-ui';

<Tabs.Root>
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="responses">Responses</Tabs.Trigger>
    <Tabs.Trigger value="insights">Insights</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">
    <!-- Overview content -->
  </Tabs.Content>
</Tabs.Root>
```

### 7. Confirmation Dialogs
**Current**: Browser confirm()
**Migration**:
```svelte
import { AlertDialog } from 'bits-ui';

<AlertDialog.Root>
  <AlertDialog.Trigger>Delete</AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Delete</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
```

### 8. Loading Progress
**Current**: Custom spinners
**Migration**:
```svelte
import { Progress } from 'bits-ui';

<Progress.Root value={progress} max={100}>
  <Progress.Track>
    <Progress.Fill />
  </Progress.Track>
</Progress.Root>
```

## Benefits of Migration

1. **Accessibility**: Built-in ARIA support
2. **Keyboard Navigation**: Proper focus management
3. **TypeScript**: Full type safety
4. **Headless**: Complete styling control
5. **Smaller Bundle**: Tree-shakeable components
6. **Consistency**: Standardized behavior

## Implementation Priority

1. **High Priority** (Core functionality):
   - Dialog (for create session modal)
   - RadioGroup (for quiz questions)
   - Button (throughout app)
   - Tabs (for analytics views)

2. **Medium Priority** (Enhanced UX):
   - AlertDialog (for confirmations)
   - Progress (for loading states)
   - PinInput (for session codes)
   - Switch (for settings)

3. **Low Priority** (Nice to have):
   - Tooltip (for help text)
   - Popover (for info)
   - Avatar (for participants)
   - Separator (visual enhancement)

## Example Migration

### Before (Custom Button):
```svelte
<button 
  onclick={handleClick}
  class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
>
  Create Session
</button>
```

### After (Bits UI Button):
```svelte
<script>
  import { Button } from 'bits-ui';
</script>

<Button.Root 
  onclick={handleClick}
  class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
>
  Create Session
</Button.Root>
```

## Notes

- All bits-ui components are headless - they need Tailwind classes for styling
- Components support all standard HTML attributes
- Use data attributes for state-based styling
- Components are SSR-compatible