```graph TD
  A[/ /] --> B[/palvelut]
  A --> C[/kotimuutto]
  A --> D[/yritysmuutto]
  A --> F[/tarjouspyynto]
  A --> G[/yhteystiedot]
  A -.legacy.-> H[/services]
  H -.redir.-> B
  A -.legacy.-> J[/services/residential-moves]
  J -.redir.-> C
  A -.legacy.-> K[/services/business-moves]
  K -.redir.-> D
  A --> L[/blog]
  L --> M[/blog/[slug]]
  L --> N[/blog/author/[slug]]
  A --> O[/auth/signin]
  A --> P[/auth/signup]
  A --> Q[/error]
```