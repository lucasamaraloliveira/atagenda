# 🔌 Manual de Integração - ATAgenda

Este documento detalha o funcionamento e a configuração do ecossistema de integração do sistema **ATAgenda**. O sistema foi projetado para ser o nó central de comunicação entre a recepção/agenda e os sistemas de execução e diagnósticos (RIS, PACS e Centrais de Laudos).

---

## 1. Visão Geral do Fluxo
O ATAgenda utiliza uma arquitetura de eventos para garantir que os dados do paciente e do agendamento fluam sem interrupções:

1. **Agendamento**: O paciente é cadastrado e o exame é marcado.
2. **Filtro de Integração**: O sistema verifica se o procedimento marcado possui a flag `Integra RIS` ativa.
3. **Exportação**: Se ativo, os dados (Worklist) são disparados via **HL7** ou **DICOM** para o destino configurado.
4. **Visualização**: O médico executor acessa as imagens no PACS e envia o laudo para a central.

---

## 2. Configurações de Parâmetros de Integração
Localizado em: `Configurações > Parâmetros > Integração`

### 🖼️ Módulo de Imagem (RIS / PACS)
Este módulo é responsável pela comunicação com os equipamentos de imagem e servidores de armazenamento (DCM4CHEE, Orthanc, etc).

*   **URL do Servidor PACS**: O endereço de rede (Endpoint) onde as requisições devem ser enviadas.
    *   *Exemplo:* `https://pacs.clinica.com.br:8042`
*   **DICOM AE Title**: (Application Entity Title) O nome de identificação da ATAgenda dentro da rede DICOM. Fundamental para que o PACS aceite a conexão.
    *   *Padrão:* `ATAGENDA_AE`
*   **Integração RIS**: Chave geral que habilita o sistema a processar filas de Worklist.

### 📄 Portal de Laudos e Conectividade
Para clínicas que utilizam terceirização de laudos ou portais de entrega de resultados.

*   **API Key (Token)**: Chave de segurança única para autenticação com o portal externo.
*   **Protocolo HL7**: Habilita a geração de mensagens no padrão *Health Level Seven*, utilizado para troca de informações clínicas e administrativas.

> [!WARNING]
> **Requisitos de Infraestrutura**:
> Integrações DICOM/HL7 geralmente requerem que o servidor da ATAgenda e o PACS estejam na mesma rede local ou conectados via **VPN**. Certifique-se de que as portas (geralmente 104 para DICOM e 443 para API) estejam liberadas no firewall.

---

## 3. Configuração por Procedimento
Nem todo procedimento precisa ser enviado para o RIS/PACS (ex: consultas de retorno). Para otimizar o fluxo, a configuração é granular:

Localizado em: `Configurações > Procedimentos > [Editar/Novo]`

*   **Switch "Integra RIS"**: 
    *   **Ativo (ON)**: Todo agendamento deste procedimento gera automaticamente uma entrada na Worklist.
    *   **Inativo (OFF)**: O agendamento permanece apenas no módulo administrativo da ATAgenda.

---

## 4. Melhores Práticas e Manutenção
*   **Padronização de Nomes**: Utilize o mesmo nome de modalidade técnica (US, CT, MR, RX) configurado no seu modalidade PACS para evitar erros de triagem no console do equipamento.
*   **Monitoramento de Erros**: Caso um exame não apareça no equipamento, verifique primeiro a conectividade da URL e se o AE Title está corretamente cadastrado no roteador DICOM.

---

## 5. Suporte Técnico
Para configurações avançadas de roteamento DICOM ou mapeamento de campos HL7 customizados, entre em contato com o time de implantação da **Alrion Tech**.

> [!NOTE]
> Este manual reflete as funcionalidades disponíveis na versão atual do sistema. Novas integrações com parceiros específicos podem ser adicionadas sob demanda.
