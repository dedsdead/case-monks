# UX Quality Checklist

**Plan:** Plataforma de Avaliação de Liderados
**Generated:** 2026-08-17 (regenerated)

---

## Navigation & Flow

- [ ] CHK036 Are all page routes specified (/ /evaluate/:id /history/:id)? [Completeness]
- [ ] CHK037 Is the navigation flow from subordinate list -> evaluation form -> success -> subordinate list specified? [Completeness]
- [ ] CHK038 Is the navigation flow from subordinate list -> history -> per-question detail specified? [Completeness]
- [ ] CHK039 Is the 404 catch-all route specified with a "Pagina nao encontrada" message and home link? [Completeness]
- [ ] CHK040 Is the redirect behavior specified when accessing /evaluate/:id for a non-subordinate (403 -> toast + home)? [Clarity]

## Identity Selection

- [ ] CHK041 Is the full-page leader selector prompt specified when no identity is stored? [Completeness]
- [ ] CHK042 Is the dropdown behavior specified (fetch all employees, display names, select one)? [Clarity]
- [ ] CHK043 Is the identity persistence specified (localStorage, survives page refresh)? [Completeness]
- [ ] CHK044 Is the identity switch behavior specified (data re-fetches for new leader)? [Completeness]
- [ ] CHK045 Is the invalid employee_id recovery flow specified (401/404 -> re-show selector)? [Completeness]

## Empty States

- [ ] CHK046 Is the empty state for "no subordinates" specified ("Voce nao possui subordinados para avaliar")? [Completeness]
- [ ] CHK047 Is the empty state for "no evaluation history" specified ("Nenhuma avaliacao registrada para este funcionario")? [Completeness]
- [ ] CHK048 Is the empty state for "no evaluations yet" specified (all subordinates with "Nao avaliado")? [Completeness]

## Loading States

- [ ] CHK049 Is a loading indicator specified for the subordinate list fetch? [Completeness]
- [ ] CHK050 Is a loading indicator specified for the evaluation form (questions + employee data fetch)? [Completeness]
- [ ] CHK051 Is a loading indicator specified for the evaluation history fetch? [Completeness]

## Form UX

- [ ] CHK052 Is the real-time weighted score preview specified (running total as questions are answered)? [Completeness]
- [ ] CHK053 Is the "X de 6 questoes respondidas" counter specified? [Completeness]
- [ ] CHK054 Is the submit button disabled state specified when not all scores are entered? [Completeness]
- [ ] CHK055 Is the confirmation dialog specified before submission ("Confirmar envio da avaliacao? Esta acao nao pode ser desfeita.")? [Completeness]
- [ ] CHK056 Is the double-click protection specified (button disabled during POST request)? [Completeness]

## Error Feedback

- [ ] CHK057 Is the success toast specified ("Avaliacao enviada com sucesso!") with auto-dismiss? [Completeness]
- [ ] CHK058 Is the error toast specified for network failures ("Erro de conexao. Tente novamente.")? [Completeness]
- [ ] CHK059 Is the 409 conflict message specified ("Voce ja avaliou este funcionario esta semana")? [Completeness]
- [ ] CHK060 Is the 403 forbidden message specified ("Voce nao tem acesso para avaliar este funcionario") with redirect to home? [Completeness]
- [ ] CHK061 Is the 404 not found message specified ("Funcionario nao encontrado")? [Completeness]
- [ ] CHK062 Is the self-evaluation blocked message specified ("Voce nao pode avaliar a si mesmo")? [Completeness]

## Responsive Design

- [ ] CHK063 Are mobile breakpoints specified (< 768px)? [Completeness]
- [ ] CHK064 Are tablet breakpoints specified (768-1024px)? [Completeness]
- [ ] CHK065 Are desktop breakpoints specified (> 1024px)? [Completeness]
- [ ] CHK066 Is the minimum touch target size specified (44px)? [Completeness]
- [ ] CHK067 Is table horizontal scroll on mobile specified? [Completeness]

## Error Boundary

- [ ] CHK068 Is the React ErrorBoundary fallback UI specified ("Algo deu errado" with retry button)? [Completeness]

## Evaluation History UX

- [ ] CHK069 Is the expandable row behavior specified for per-question breakdown in history? [Completeness]
- [ ] CHK070 Is the history table column set specified (week, year, date, total_score, expandable)? [Completeness]

## Subordinate List UX

- [ ] CHK071 Is the "Avaliado" badge specified for subordinates already evaluated this week? [Completeness]
- [ ] CHK072 Is the disabled "Avaliar" button specified when already evaluated this week? [Completeness]
- [ ] CHK073 Is the "Avaliar" button link to /evaluate/:id specified? [Completeness]
- [ ] CHK074 Is the "Historico" button link to /history/:id specified? [Completeness]
- [ ] CHK075 Is it specified that hierarchy depth is displayed (e.g., indentation or badge for "Direct" vs "Indirect")? [Completeness]
- [ ] CHK076 Is it specified that email is NOT rendered in the EmployeeList component (hidden per clarification decision)? [Clarity]

## Color Palette

- [ ] CHK077 Are all 5 CSS custom properties defined in `src/index.css` (:root) with correct hex values (#2c2c2c, #e8e7e2, #767573, #949492, #8c8c8c)? [Completeness]
- [ ] CHK078 Is `--color-primary` (#2c2c2c) used for primary text, headers, buttons, and strong emphasis? [Consistency]
- [ ] CHK079 Is `--color-background` (#e8e7e2) applied to body and main containers? [Consistency]
- [ ] CHK080 Is `--color-muted` (#767573) used for secondary text, captions, and subtle elements? [Consistency]
- [ ] CHK081 Is `--color-border` (#949492) used for input borders, table dividers, and disabled button backgrounds? [Consistency]
- [ ] CHK082 Is `--color-secondary` (#8c8c8c) used for hover states, placeholder text, and tertiary elements? [Consistency]
- [ ] CHK083 Are button styles consistent: primary (primary bg + background text), secondary (border bg + primary text)? [Consistency]
- [ ] CHK084 Are input styles consistent: border border, background bg, primary text? [Consistency]
- [ ] CHK085 Are disabled states using border bg + muted text (not hardcoded colors)? [Consistency]
