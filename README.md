# Two-s — Frontend Mobile (React Native)

Aplicativo financeiro **visual e navegável** para Android e iOS, com dados **100% fictícios**.  
Nenhuma chamada HTTP/WebSocket, Core Banking, DICT, SPI, Lydians ou banco de dados remoto.

## Stack

- Expo (Development Build / Expo Go conforme o marco)
- React Native + TypeScript
- React Navigation (tabs + stacks)
- React Hook Form + Zod
- React Native Testing Library / Jest

## Credenciais de demonstração

| Campo | Valor |
|-------|-------|
| CPF   | `529.982.247-25` |
| Senha | `123456` |
| Código recuperação | `847291` |

## Instalação

```bash
npm install
npx expo start
```

- Android: `a` no terminal ou `npm run android`
- iOS (macOS): `i` ou `npm run ios`
- QR Code no Expo Go / development build

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | Metro / Expo |
| `npm run android` | Abre no emulador/dispositivo Android |
| `npm run ios` | Abre no simulador iOS |
| `npm test` | Testes unitários/componentes |
| `npm run typecheck` | Verificação TypeScript |

## Builds de homologação

### Preview (EAS — recomendado)

```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
eas build -p ios --profile preview
```

### Local

```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

## Estrutura

```
src/
  components/     # UI reutilizável
  context/        # Sessão e preferências locais
  fixtures/       # Dados fictícios centralizados
  models/         # Tipos TypeScript
  navigation/     # Tabs e stacks
  screens/        # Telas por jornada
  services/       # Serviços simulados (swap futuro por APIs)
  theme/          # Cores, tipografia, espaçamento
  utils/          # Máscaras e formatação
  validation/     # Schemas Zod
```

## Jornadas implementadas

1. **Acesso** — login, recuperação/redefinição, biometria visual, início com saldo ocultável  
2. **Pix** — chave (CPF/CNPJ/telefone/e-mail/aleatória), agência/conta, copia e cola, QR, confirmação, resultados (sucesso/falha/pendência/cancelamento), comprovante  
3. **Cobrança** — geração visual de QR / código  
4. **Extrato** — listagem, detalhe, comprovante, devolução total/parcial  
5. **Chaves e limites** — CRUD visual, portabilidade, reivindicação, limites por perfil/período/noturno, favoritos  
6. **Pix Agendado** — criar, listar, cancelar  
7. **Pix Automático** — autorizações pendentes/ativas/histórico  
8. **MED** — intro, seleção de transação, motivo, documento simulado, protocolo e acompanhamento  

## Estados de UI

Carregamento, vazio, sucesso, falha, pendência e indisponibilidade via `StateView` e fluxos de transferência.

## Integração futura

Substitua as implementações em `src/services/` por clientes HTTP reais mantendo os mesmos contratos tipados em `src/models/`. As telas consomem hooks/serviços — não fixtures diretamente (exceto demo credentials na tela de login).

## Regra desta etapa

- Sem rede  
- Sem dados reais de clientes  
- Sem credenciais/certificados de produção  
- Todas as ações financeiras são simuladas localmente  

## Entrega Two-s

- Código no repositório indicado pela contratante  
- Branches e PRs por marco (M1–M5)  
- Builds periódicos para UAT Android/iOS  

---

**Two-s Cooperativa** — frontend demonstrável · versão 1.0
