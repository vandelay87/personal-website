import { getUploadUrl } from '@api/recipes'
import type { Step } from '@models/recipe'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import StepList from './StepList'
import styles from './StepList.module.css'

vi.mock('@api/recipes', () => ({
  getUploadUrl: vi.fn(),
}))

const mockGetUploadUrl = vi.mocked(getUploadUrl)

const STEP_ID_1 = '11111111-1111-4111-8111-111111111111'
const STEP_ID_2 = '22222222-2222-4222-8222-222222222222'

const makeStep = (stepId: string, order: number, text: string): Step => ({ stepId, order, text })

const mockGetToken = vi.fn().mockResolvedValue('token-123')

describe('StepList', () => {
  const twoSteps: Step[] = [
    makeStep(STEP_ID_1, 1, 'Preheat oven'),
    makeStep(STEP_ID_2, 2, 'Mix ingredients'),
  ]

  it('renders step rows with text textarea', () => {
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const textareas = screen.getAllByRole('textbox', { name: /^step \d+ text$/i })
    expect(textareas).toHaveLength(2)
    expect(textareas[0]).toHaveValue('Preheat oven')
    expect(textareas[1]).toHaveValue('Mix ingredients')
  })

  it('step numbers auto-update', () => {
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  describe('"Add step" assigns a fresh stepId', () => {
    beforeEach(() => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(
        '33333333-3333-4333-8333-333333333333'
      )
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('appends a step carrying a crypto.randomUUID stepId', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      // Tightened to an exact match: with a getToken prop, each row also
      // renders ImageUpload's own "+ Add step image" button, whose
      // accessible name is otherwise also matched by a loose /add step/i.
      await user.click(screen.getByRole('button', { name: /^add step$/i }))

      expect(onChange).toHaveBeenCalledWith([
        ...twoSteps,
        { stepId: '33333333-3333-4333-8333-333333333333', order: 3, text: '' },
      ])
    })
  })

  it('remove button removes a row (minimum 1 enforced)', () => {
    const onChange = vi.fn()
    render(
      <StepList
        steps={[makeStep(STEP_ID_1, 1, 'Only step')]}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const removeButton = screen.getByRole('button', { name: /remove/i })
    expect(removeButton).toBeDisabled()
  })

  it('move up/down reorder and renumber steps', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(onChange).toHaveBeenCalledWith([
      { stepId: STEP_ID_2, order: 1, text: 'Mix ingredients' },
      { stepId: STEP_ID_1, order: 2, text: 'Preheat oven' },
    ])
  })

  // NEW (#198): reordering must keep each step's stepId attached to its content;
  // only `order` changes. This guarantees stepId-keyed image URLs survive reorder.
  it('reordering preserves each step\'s stepId — only order changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <StepList
        steps={twoSteps}
        onChange={onChange}
        getToken={mockGetToken}
        recipeId="test-recipe-id"
        slug="beans-on-toast"
      />
    )

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    const next = onChange.mock.calls[0][0] as Step[]
    // The second step's content is now first, but it carries its original stepId.
    expect(next[0]).toMatchObject({ stepId: STEP_ID_2, text: 'Mix ingredients', order: 1 })
    expect(next[1]).toMatchObject({ stepId: STEP_ID_1, text: 'Preheat oven', order: 2 })
    // The set of stepIds is unchanged across the reorder.
    expect(new Set(next.map((s) => s.stepId))).toEqual(new Set([STEP_ID_1, STEP_ID_2]))
  })

  it('after reordering two steps, the rendered step-number labels reflect the new order', async () => {
    const user = userEvent.setup()
    const Wrapper = () => {
      const [steps, setSteps] = useState<Step[]>(twoSteps)
      return (
        <StepList
          steps={steps}
          onChange={setSteps}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )
    }
    render(<Wrapper />)

    const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
    await user.click(moveDownButtons[0])

    expect(screen.getByLabelText('Step 1 text')).toHaveValue('Mix ingredients')
    expect(screen.getByLabelText('Step 2 text')).toHaveValue('Preheat oven')
  })

  describe('per-step image upload (when getToken is provided)', () => {
    it('renders an image upload control per step, with no alt-text input until the image is ready', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      // ImageUpload's step-image control now has an accessible name of
      // "Add step image" rather than a generic "Upload".
      const uploadButtons = screen.getAllByRole('button', { name: /^add step image$/i })
      expect(uploadButtons).toHaveLength(2)

      // NEW (#228): mirrors the cover image's alt field — the alt-text input
      // only appears once the step image has finished processing (imgReady),
      // never alongside the "Add step image" ghost button (imgEmpty).
      expect(screen.queryByLabelText('Step 1 image alt text')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Step 2 image alt text')).not.toBeInTheDocument()
    })

    it('renders the alt-text input per step once each step image is ready', () => {
      const onChange = vi.fn()
      const readySteps: Step[] = [
        { stepId: STEP_ID_1, order: 1, text: 'Preheat oven', image: { alt: '', processedAt: 111 } },
        { stepId: STEP_ID_2, order: 2, text: 'Mix ingredients', image: { alt: '', processedAt: 222 } },
      ]
      render(
        <StepList
          steps={readySteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      expect(screen.getByLabelText('Step 1 image alt text')).toBeInTheDocument()
      expect(screen.getByLabelText('Step 2 image alt text')).toBeInTheDocument()
    })

    it('does not render the image upload control when getToken is not provided', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      expect(screen.queryByRole('button', { name: /^upload$/i })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Step 1 image alt text')).not.toBeInTheDocument()
    })

    it('passes processedAt through to per-step ImageUpload so the correct render branch shows', () => {
      const onChange = vi.fn()
      const unreadyStep: Step = {
        stepId: STEP_ID_1,
        order: 1,
        text: 'Stir',
        image: { alt: 'x' },
      }
      const { rerender } = render(
        <StepList
          steps={[unreadyStep]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      // NEW (#228): without a prior upload attempt in this session, an
      // unset processedAt now renders the empty "Add step image" control
      // rather than the processing placeholder — see ImageUpload's own
      // render-branch tests for the case where the placeholder legitimately
      // shows (an upload genuinely in flight).
      expect(screen.getByRole('button', { name: /^add step image$/i })).toBeInTheDocument()
      expect(screen.queryByRole('img')).not.toBeInTheDocument()

      const readyStep: Step = {
        stepId: STEP_ID_1,
        order: 1,
        text: 'Stir',
        image: { alt: 'x', processedAt: 12345 },
      }
      rerender(
        <StepList
          steps={[readyStep]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      expect(screen.getByRole('img')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /^add step image$/i })
      ).not.toBeInTheDocument()
    })

    it('typing in the alt-text input calls onChange with the updated step (no key field)', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      const step: Step = {
        stepId: STEP_ID_1,
        order: 1,
        text: 'Preheat oven',
        image: { alt: '', processedAt: 111 },
      }
      render(
        <StepList
          steps={[step]}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const altInput = screen.getByLabelText('Step 1 image alt text')
      await user.type(altInput, 'A')

      expect(onChange).toHaveBeenCalledWith([
        { stepId: STEP_ID_1, order: 1, text: 'Preheat oven', image: { alt: 'A' } },
      ])
    })
  })

  // Regression (#201): a step's just-selected image preview lives in ImageUpload's
  // local component state (setPreview from URL.createObjectURL, set synchronously on
  // file-select, before any network). Rows were keyed by array index, so on reorder
  // React reused the position-1 ImageUpload instance and the preview stayed stuck at
  // the original slot while the step text moved. Keying by step.stepId moves each
  // ImageUpload instance (and its preview state) with its step. This test fails with
  // key={index} and passes with key={step.stepId}.
  describe('reorder keeps each step\'s selected image preview attached to its step', () => {
    const PREVIEW_BLOB = 'blob:preview-mock'

    beforeEach(() => {
      mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://upload.example/put' })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
      vi.stubGlobal(
        'URL',
        Object.assign({}, URL, {
          createObjectURL: vi.fn(() => PREVIEW_BLOB),
          revokeObjectURL: vi.fn(),
        })
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    // The row containing the given step text; both the textarea and that step's
    // ImageUpload preview share the step's row body, so scope queries to it.
    const rowFor = (text: string): HTMLElement => {
      const textarea = screen.getByDisplayValue(text)
      const row = textarea.closest(`.${styles.row}`)
      if (!row) throw new Error(`No row found for step text "${text}"`)
      return row as HTMLElement
    }

    it('moves the uploaded preview into the row of the step it belongs to after reorder', async () => {
      const user = userEvent.setup()
      const Wrapper = () => {
        const [steps, setSteps] = useState<Step[]>([
          makeStep(STEP_ID_1, 1, 'First step text'),
          makeStep(STEP_ID_2, 2, 'Second step text'),
        ])
        return (
          <StepList
            steps={steps}
            onChange={setSteps}
            getToken={mockGetToken}
            recipeId="test-recipe-id"
            slug="beans-on-toast"
          />
        )
      }
      render(<Wrapper />)

      // Select a file on the FIRST step's file upload input.
      const file = new File(['x'], 'photo.png', { type: 'image/png' })
      const firstRowFileInput = within(rowFor('First step text')).getByLabelText(
        'Upload image'
      )
      fireEvent.change(firstRowFileInput, { target: { files: [file] } })

      // The preview appears synchronously in the first step's row.
      await waitFor(() => {
        expect(
          within(rowFor('First step text')).getByAltText('Upload preview')
        ).toBeInTheDocument()
      })
      expect(
        within(rowFor('Second step text')).queryByAltText('Upload preview')
      ).not.toBeInTheDocument()

      // Reorder: move the first step down to the second position.
      await user.click(screen.getByRole('button', { name: 'Move down step 1' }))

      // The preview must travel WITH "First step text", now in the second slot.
      expect(
        within(rowFor('First step text')).getByAltText('Upload preview')
      ).toBeInTheDocument()
      // The step that moved up ("Second step text") never had a preview.
      expect(
        within(rowFor('Second step text')).queryByAltText('Upload preview')
      ).not.toBeInTheDocument()
    })
  })

  // Regression (#201): uploading an image to a step must record the image in form
  // state (mirroring the always-present coverImage), so it is persisted by
  // buildPatchPayload and polled by useImageProcessingPoll — even if the user never
  // types alt text. Before the fix, only typing alt text set step.image, so an
  // upload-only step had image === undefined and was silently dropped on reload.
  describe('uploading an image records it in form state', () => {
    beforeEach(() => {
      mockGetUploadUrl.mockResolvedValue({ uploadUrl: 'https://upload.example/put' })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
      vi.stubGlobal(
        'URL',
        Object.assign({}, URL, {
          createObjectURL: vi.fn(() => 'blob:preview-mock'),
          revokeObjectURL: vi.fn(),
        })
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.restoreAllMocks()
    })

    it('marks the step as carrying an image once the upload completes', async () => {
      const onChange = vi.fn()
      const Wrapper = () => {
        const [steps, setSteps] = useState<Step[]>([makeStep(STEP_ID_1, 1, 'Stir')])
        return (
          <StepList
            steps={steps}
            onChange={(next) => {
              onChange(next)
              setSteps(next)
            }}
            getToken={mockGetToken}
            recipeId="test-recipe-id"
            slug="beans-on-toast"
          />
        )
      }
      render(<Wrapper />)

      const file = new File(['x'], 'photo.png', { type: 'image/png' })
      fireEvent.change(screen.getByLabelText('Upload image'), {
        target: { files: [file] },
      })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith([
          expect.objectContaining({
            stepId: STEP_ID_1,
            image: expect.objectContaining({ alt: expect.any(String) }),
          }),
        ])
      })
    })
  })

  describe('accessibility — touch targets', () => {
    it('move up buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const moveUpButtons = screen.getAllByRole('button', { name: /move up/i })
      moveUpButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('move down buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const moveDownButtons = screen.getAllByRole('button', { name: /move down/i })
      moveDownButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })

    it('remove buttons carry the action-button class (44x44px min)', () => {
      const onChange = vi.fn()
      render(
        <StepList
          steps={twoSteps}
          onChange={onChange}
          getToken={mockGetToken}
          recipeId="test-recipe-id"
          slug="beans-on-toast"
        />
      )

      const removeButtons = screen.getAllByRole('button', { name: /remove step/i })
      removeButtons.forEach((button) => {
        expect(button).toHaveClass(styles.actionButton)
      })
    })
  })
})
