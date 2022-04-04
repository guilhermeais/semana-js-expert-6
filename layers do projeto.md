-> Server
  service: tudo o que é regra de negocio ou processamento;
  controller: intermediar a camada de apresentação (routes) e a camada de negócio;
  routes: camada de apresentação (aqui que o cliente consegue ter acesso ao nosso dado);
  server: responsável por criar o servidor (mas não instância nem inicia ele)
  index: instância o servidor e expõe para web (lado da infraestrutura);
  config: tudo o que for estático do projeto;

-> Client
  service = tudo que é regra de negócio ou processamento
  controller = é o intermédio entre a view e o service
  view = tudo que é elemento HTML (visualização)
  index = Factory que inicializa tudo