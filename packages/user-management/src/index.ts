/** Table of user permission strings */
export const perm = {
  specialArrangements: 'special-arrangements',
  observations: 'observations',
  registrations: { send: 'registrations::send' },
  ktpConnection: { open: 'ktp-connection::open' },
  answerPackages: { send: 'answer-packages::send' },

  resultList: {
    view: 'result-list::view',
    viewWithSsns: 'result-list::view-with-ssns'
  },

  notification: {
    deniedParticipation: {
      all: 'notification-denied-participation',
      notify: 'notification-denied-participation::notify',
      viewDecision: 'notification-denied-participation::view-decision'
    },
    includedExams: {
      all: 'notification-included-exams',
      viewDecision: 'notification-included-exams::view-decision'
    }
  },

  application: {
    technicalFault: 'application-technical-fault',
    dyslexia: {
      all: 'application-dyslexia',
      viewDecision: 'application-dyslexia::view-decision'
    },
    foreign: {
      all: 'application-foreign',
      viewDecision: 'application-foreign::view-decision'
    },
    illness: {
      all: 'application-illness',
      viewDecision: 'application-illness::view-decision'
    },
    nullify: {
      all: 'application-nullify-registration',
      viewDecision: 'application-nullify-registration::view-decision'
    },
    change: {
      all: 'application-change-registration',
      viewDecision: 'application-change-registration::view-decision'
    },
    late: {
      all: 'application-late-registration',
      viewDecision: 'application-late-registration::view-decision'
    }
  }
} as const

/** Helper to get the union of the types of the leaves of a nested object */
type Leaves<Tree, Node = Tree[keyof Tree]> = Node extends Record<string, any> ? Leaves<Node> : Node

/** A user permission string */
export type Perm = Leaves<typeof perm>
