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
    selectIdentity: 'Selecionar identidade',
    invalidEmployeeId: 'ID de funcionário inválido',
    employeeNotFound: 'Funcionário não encontrado',
    accessDenied: 'Acesso negado',
    
    // Employee
    employees: 'Funcionários',
    employee: 'Funcionário',
    position: 'Cargo',
    email: 'E-mail',
    noSubordinates: 'Nenhum subordinado encontrado',
    
    // Evaluation
    evaluate: 'Avaliar',
    evaluation: 'Avaliação',
    evaluations: 'Avaliações',
    evaluationHistory: 'Histórico de Avaliações',
    noEvaluations: 'Nenhuma avaliação registrada para este funcionário',
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
    score: 'Pontuação',
    // History
    history: 'Histórico',
    date: 'Data',
    week: 'Semana',
    year: 'Ano',
    
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
    login: 'Login',
    logout: 'Logout',
    selectIdentity: 'Select identity',
    invalidEmployeeId: 'Invalid employee ID',
    employeeNotFound: 'Employee not found',
    accessDenied: 'Access denied',
    
    // Employee
    employees: 'Employees',
    employee: 'Employee',
    position: 'Position',
    email: 'Email',
    noSubordinates: 'No subordinates found',
    
    // Evaluation
    evaluate: 'Evaluate',
    evaluation: 'Evaluation',
    evaluations: 'Evaluations',
    evaluationHistory: 'Evaluation History',
    noEvaluations: 'No evaluations recorded for this employee',
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
    score: 'Score',
    scores: 'Scores',
    
    // History
    history: 'History',
    date: 'Date',
    week: 'Week',
    year: 'Year',
    
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