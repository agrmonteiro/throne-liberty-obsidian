# Throne & Liberty — Obsidian Command

> **Beta pública** — ferramenta desktop para análise e otimização de personagens no Throne & Liberty.

![versão](https://img.shields.io/badge/versão-1.0.0--beta.1-gold)
![plataforma](https://img.shields.io/badge/plataforma-Windows-blue)
![licença](https://img.shields.io/badge/licença-privado-lightgrey)

---

## O que é

**Obsidian Command** é um app desktop para jogadores do Throne & Liberty que querem ir além do feeling e entender seus personagens com dados reais.

Você importa sua build diretamente do [Questlog](https://questlog.gg), ajusta manualmente o que precisar, e usa o motor de cálculo de dano para simular, comparar e otimizar.

---

## Funcionalidades

### Importação de Build
- Cole o link da sua build no Questlog e o app extrai todos os stats automaticamente via scraper Python
- Preview editável antes de salvar — corrija qualquer campo antes de confirmar
- Campos editados manualmente ficam marcados visualmente (badge) em todo o app
- Re-importação com **diff visual**: veja exatamente o que mudou e aceite ou rejeite campo a campo

### Análise de Dano
- **Calculator** — motor de cálculo de DPS puro e determinístico com todos os bônus do T&L
- **Comparator** — compare duas builds lado a lado com gráfico de diferença
- **Sensitivity** — simule o impacto de aumentar cada stat: quanto DPS você ganha por ponto de Crit, CDR, etc.
- **Dashboard** — visão geral de todas as builds com métricas principais

### Log Reader
- Importe seus arquivos de combat log do T&L
- Veja DPS ao longo do tempo, detalhamento por skill, taxa de crit/heavy
- Detecção automática de pulls (combates) por gap de tempo
- Exporte a timeline para o Rotation Builder para comparar teoria com prática

### Rotation Builder
- Monte rotações de skills com timeline interativa
- Suporte a DoTs, buffs, regras de chaining e conflitos de cooldown
- Compare rotação planejada vs real (do Log Reader)
- Importe stats da build ativa automaticamente

---

## Instalação

### Requisitos

| Requisito | Versão mínima | Observação |
|-----------|---------------|------------|
| Windows | 10 ou superior | App testado no Windows 10/11 |
| Python | 3.9+ | Necessário para importar builds do Questlog |

> **Python** precisa estar instalado e disponível no PATH. Baixe em [python.org](https://www.python.org/downloads/).

### Scraper (obrigatório para importar builds)

O scraper Python é um projeto separado necessário para a importação de builds.

1. Clone o repositório do scraper **na mesma pasta pai** do Obsidian Command:
   ```
   Documentos/
   ├── throne_and_liberty_node/     ← este app
   └── throne_and_liberty_agent/    ← scraper (clone aqui)
   ```

2. Clone o scraper:
   ```bash
   git clone https://github.com/agrmonteiro/throne_and_liberty_agent
   ```

3. Instale as dependências do scraper:
   ```bash
   cd throne_and_liberty_agent
   pip install -r requirements.txt
   ```

### Instalar o App

1. Baixe o instalador `.exe` na [página de releases](https://github.com/agrmonteiro/throne-liberty-obsidian/releases)
2. Execute o instalador e siga as instruções
3. Abra **Throne & Liberty** pelo atalho na área de trabalho ou menu iniciar

---

## Como usar

### Importar uma build

1. Acesse [questlog.gg](https://questlog.gg) e abra a página da sua build
2. Copie o link da URL
3. No app, vá em **Builds → Importar Build**
4. Cole o link e aguarde o scraper extrair os dados (~10–30 segundos)
5. Revise os dados no preview e clique **Salvar**

### Analisar seus logs de combate

1. Vá em **Settings** e selecione a pasta de combat logs do T&L
   - Caminho padrão: `%LOCALAPPDATA%\TL\Saved\COMBATLOGS`
2. Abra **Log Reader** e selecione um arquivo de log
3. Os pulls são detectados automaticamente — use o slider para ajustar a separação se necessário

### Atualizar uma build

Builds importadas com link ficam com o botão **Atualizar** disponível. Clique para re-importar automaticamente e veja o diff do que mudou.

---

## Dados e privacidade

- **100% local** — nenhum dado é enviado para servidores
- Builds são salvas em `%APPDATA%\throne-liberty\data\builds.json`
- Logs de combat nunca saem do seu computador

---

## Reportar problemas

Esta é uma **versão beta**. Bugs são esperados.

Abra uma [issue no GitHub](https://github.com/agrmonteiro/throne-liberty-obsidian/issues) com:
- Descrição do problema
- O que você estava fazendo quando aconteceu
- Print da tela (se possível)
- Versão do Windows e do Python

---

## Stack técnica

| Camada | Tecnologia |
|--------|-----------|
| Desktop | Electron 31 |
| UI | React 18 + TypeScript + Tailwind CSS |
| Estado | Zustand |
| Gráficos | Recharts |
| Scraper | Python 3 (projeto separado) |
| Build | electron-vite + electron-builder |

---

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo dev
npm run dev

# Gerar instalador Windows
npm run package
```

---

*Throne & Liberty é uma marca registrada da NCSoft. Este projeto não é afiliado à NCSoft.*
