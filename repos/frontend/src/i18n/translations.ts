export type Language = 'pt-BR' | 'en';

export const translations = {
  'pt-BR': {
    // Common
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Salvar',
    back: 'Voltar',
    home: 'Início',
    close: 'Fechar',
    toggleMenu: 'Alternar menu',
    openMenu: 'Abrir menu',
    
    // Authentication
    login: 'Entrar',
    logout: 'Sair',
    selectIdentity: 'Trocar líder',
    selectLeaderTitle: 'Selecione sua identidade',
    invalidEmployeeId: 'ID de funcionário inválido',
    employeeNotFound: 'Funcionário não encontrado',
    accessDenied: 'Acesso negado',
    
    // Employee
    employees: 'Funcionários',
    employee: 'Funcionário',
    position: 'Cargo',
    email: 'E-mail',
    noSubordinates: 'Nenhum subordinado encontrado',
    noSubordinatesMessage: 'Você não possui subordinados para avaliar.',
    
    // Evaluation
    evaluate: 'Avaliar',
    evaluation: 'Avaliação',
    evaluations: 'Avaliações',
    evaluationHistory: 'Histórico de Avaliações',
    noEvaluations: 'Nenhuma avaliação registrada para este funcionário',
    noRegisteredEvaluations: 'Nenhuma avaliação registrada.',
    submitEvaluation: 'Enviar Avaliação',
    evaluationSubmitted: 'Avaliação enviada com sucesso!',
    evaluationError: 'Erro ao enviar avaliação',
    alreadyEvaluated: 'Você já avaliou esta semana',
    cannotEvaluateSelf: 'Não é possível avaliar a si mesmo',
    evaluating: 'Avaliando',
    questionsAnswered: 'de 6 questões respondidas',
    partialScore: 'Nota parcial',
    weight: 'Peso',
    scoreRange: 'Pontuação deve ser entre 1 e 4',
    
    // Questions
    questions: 'Perguntas',
    question: 'Questão',
    score: 'Pontuação',
    scores: 'Pontuações',
    
    // History
    history: 'Histórico',
    date: 'Data',
    week: 'Semana',
    year: 'Ano',

    // App / layout
    appTitle: 'Avaliações',
    somethingWentWrong: 'Algo deu errado',

    // Subordinates list
    subordinatesTitle: 'Meus Subordinados',
    subordinatesCount: '{count} funcionário(s) na sua hierarquia',
    evaluatedEmployeesCount: '{count} funcionário(s) avaliados',
    actions: 'Ações',
    direct: 'Direto',
    level: 'Nível {level}',
    evaluatedBadge: 'Avaliado',
    notEvaluated: 'Não avaliado',
    evaluateEmployee: 'Avaliar {name}',
    viewHistoryFor: 'Ver histórico de {name}',

    // Page titles
    evaluateTitle: 'Avaliação de {name}',
    historyTitle: 'Histórico de {name}',
    pageNotFound: 'Página não encontrada',
    backToHome: 'Voltar para o início',

    // History tables
    details: 'Detalhes',
    hideDetails: 'Ocultar',
    contribution: 'Contribuição',
    total: 'Total',

    // Leader selector
    selectEmployeePlaceholder: 'Selecione um funcionário...',
    loadEmployeesError: 'Falha ao carregar lista de funcionários. Tente novamente.',
    selectEmployeeRequired: 'Por favor, selecione um funcionário.',
    authError: 'Falha ao autenticar. Tente novamente.',

    // Confirm dialog
    confirmSubmitMessage: 'Confirmar envio da avaliação? Esta ação não pode ser desfeita.',
    
    
    // Errors
    connectionFailed: 'Falha na conexão. Verifique sua internet e tente novamente.',
    serverError: 'Erro no servidor. Tente novamente mais tarde.',
    unknownError: 'Erro desconhecido. Tente novamente.',
    accessDeniedError: 'Você não tem acesso para visualizar este funcionário',
    employeeNotFoundError: 'Funcionário não encontrado',
    loadDataError: 'Erro ao carregar dados do funcionário',
    retry: 'Tentar novamente',
    refresh: 'Atualizar',
    
    // Success
    operationSuccess: 'Operação realizada com sucesso',
  },
  'en': {
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    back: 'Back',
    home: 'Home',
    close: 'Close',
    toggleMenu: 'Toggle menu',
    openMenu: 'Open menu',
    
    // Authentication
    login: 'Sign in',
    logout: 'Logout',
    selectIdentity: 'Switch leader',
    selectLeaderTitle: 'Select your identity',
    invalidEmployeeId: 'Invalid employee ID',
    employeeNotFound: 'Employee not found',
    accessDenied: 'Access denied',
    
    // Employee
    employees: 'Employees',
    employee: 'Employee',
    position: 'Position',
    email: 'Email',
    noSubordinates: 'No subordinates found',
    noSubordinatesMessage: "You don't have any subordinates to evaluate.",
    
    // Evaluation
    evaluate: 'Evaluate',
    evaluation: 'Evaluation',
    evaluations: 'Evaluations',
    evaluationHistory: 'Evaluation History',
    noEvaluations: 'No evaluations recorded for this employee',
    noRegisteredEvaluations: 'No evaluations registered.',
    submitEvaluation: 'Submit Evaluation',
    evaluationSubmitted: 'Evaluation submitted successfully!',
    evaluationError: 'Error submitting evaluation',
    alreadyEvaluated: 'You have already evaluated this week',
    cannotEvaluateSelf: 'Cannot evaluate yourself',
    evaluating: 'Evaluating',
    questionsAnswered: 'of 6 questions answered',
    partialScore: 'Partial score',
    weight: 'Weight',
    scoreRange: 'Score must be between 1 and 4',
    
    // Questions
    questions: 'Questions',
    question: 'Question',
    score: 'Score',
    scores: 'Scores',
    
    // History
    history: 'History',
    date: 'Date',
    week: 'Week',
    year: 'Year',

    // App / layout
    appTitle: 'Evaluations',
    somethingWentWrong: 'Something went wrong',

    // Subordinates list
    subordinatesTitle: 'My Subordinates',
    subordinatesCount: '{count} employee(s) in your hierarchy',
    evaluatedEmployeesCount: '{count} evaluated employee(s)',
    actions: 'Actions',
    direct: 'Direct',
    level: 'Level {level}',
    evaluatedBadge: 'Evaluated',
    notEvaluated: 'Not evaluated',
    evaluateEmployee: 'Evaluate {name}',
    viewHistoryFor: 'View history of {name}',

    // Page titles
    evaluateTitle: 'Evaluation of {name}',
    historyTitle: 'History of {name}',
    pageNotFound: 'Page not found',
    backToHome: 'Back to home',

    // History tables
    details: 'Details',
    hideDetails: 'Hide',
    contribution: 'Contribution',
    total: 'Total',

    // Leader selector
    selectEmployeePlaceholder: 'Select an employee...',
    loadEmployeesError: 'Failed to load employee list. Please try again.',
    selectEmployeeRequired: 'Please select an employee.',
    authError: 'Authentication failed. Please try again.',

    // Confirm dialog
    confirmSubmitMessage: 'Confirm evaluation submission? This action cannot be undone.',
    
    
    // Errors
    connectionFailed: 'Connection failed. Check your internet and try again.',
    serverError: 'Server error. Please try again later.',
    unknownError: 'Unknown error. Please try again.',
    accessDeniedError: "You don't have access to view this employee",
    employeeNotFoundError: 'Employee not found',
    loadDataError: 'Error loading employee data',
    retry: 'Try again',
    refresh: 'Refresh',
    
    // Success
    operationSuccess: 'Operation completed successfully',
  }
} as const;

export type TranslationKey = keyof typeof translations['pt-BR'];