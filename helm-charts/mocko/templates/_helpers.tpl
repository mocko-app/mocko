{{/*
Expand the name of the chart.
*/}}
{{- define "mocko.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "mocko.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "mocko.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "mocko.labels" -}}
helm.sh/chart: {{ include "mocko.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component-specific full names
*/}}
{{- define "mocko.core.fullname" -}}
{{- printf "%s-core" (include "mocko.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mocko.control.fullname" -}}
{{- printf "%s-control" (include "mocko.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "mocko.redis.fullname" -}}
{{- printf "%s-redis" (include "mocko.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Component labels — include common labels plus the component name
*/}}
{{- define "mocko.core.labels" -}}
{{ include "mocko.labels" . }}
app.kubernetes.io/name: {{ include "mocko.core.fullname" . }}
app.kubernetes.io/component: core
{{- end }}

{{- define "mocko.control.labels" -}}
{{ include "mocko.labels" . }}
app.kubernetes.io/name: {{ include "mocko.control.fullname" . }}
app.kubernetes.io/component: control
{{- end }}

{{- define "mocko.redis.labels" -}}
{{ include "mocko.labels" . }}
app.kubernetes.io/name: {{ include "mocko.redis.fullname" . }}
app.kubernetes.io/component: redis
{{- end }}

{{/*
Selector labels — used in Deployment.spec.selector and Service.spec.selector
*/}}
{{- define "mocko.core.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mocko.core.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "mocko.control.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mocko.control.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "mocko.redis.selectorLabels" -}}
app.kubernetes.io/name: {{ include "mocko.redis.fullname" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Resolved image tags — fall back to chart appVersion when tag is not set
*/}}
{{- define "mocko.core.image" -}}
{{- printf "%s:%s" .Values.core.image.repository (.Values.core.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{- define "mocko.control.image" -}}
{{- printf "%s:%s" .Values.control.image.repository (.Values.control.image.tag | default .Chart.AppVersion) }}
{{- end }}

{{/*
Redis environment variables — shared between core and control deployments.
Handles internal Redis (auto-wired) and external Redis (url or host/port/password).
*/}}
{{- define "mocko.redis.envVars" -}}
{{- if .Values.persistence.redis.internal.enabled }}
- name: REDIS_HOST
  value: {{ include "mocko.redis.fullname" . | quote }}
- name: REDIS_PORT
  value: "6379"
- name: REDIS_DATABASE
  value: "0"
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ include "mocko.fullname" . }}
      key: redis-password
{{- else if .Values.persistence.redis.existingSecret }}
{{- if .Values.persistence.redis.existingSecret.urlKey }}
- name: REDIS_URL
  valueFrom:
    secretKeyRef:
      name: {{ .Values.persistence.redis.existingSecret.name }}
      key: {{ .Values.persistence.redis.existingSecret.urlKey }}
{{- else }}
{{- if .Values.persistence.redis.host }}
- name: REDIS_HOST
  value: {{ .Values.persistence.redis.host | quote }}
{{- end }}
- name: REDIS_PORT
  value: {{ .Values.persistence.redis.port | quote }}
- name: REDIS_DATABASE
  value: {{ .Values.persistence.redis.database | quote }}
{{- if .Values.persistence.redis.existingSecret.passwordKey }}
- name: REDIS_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.persistence.redis.existingSecret.name }}
      key: {{ .Values.persistence.redis.existingSecret.passwordKey }}
{{- end }}
{{- end }}
{{- else if .Values.persistence.redis.url }}
- name: REDIS_URL
  value: {{ .Values.persistence.redis.url | quote }}
{{- else }}
{{- if .Values.persistence.redis.host }}
- name: REDIS_HOST
  value: {{ .Values.persistence.redis.host | quote }}
{{- end }}
- name: REDIS_PORT
  value: {{ .Values.persistence.redis.port | quote }}
- name: REDIS_DATABASE
  value: {{ .Values.persistence.redis.database | quote }}
{{- if .Values.persistence.redis.password }}
- name: REDIS_PASSWORD
  value: {{ .Values.persistence.redis.password | quote }}
{{- end }}
{{- end }}
{{- end }}
