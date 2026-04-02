import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'immobilie',
  title: 'Immobilie',
  type: 'document',
  fields: [
    defineField({
      name: 'titel',
      title: 'Titel',
      type: 'string'
    }),
    defineField({
      name: 'ort',
      title: 'Ort',
      type: 'string'
    }),
    defineField({
      name: 'preis',
      title: 'Preis',
      type: 'string'
    }),
    defineField({
      name: 'wohnflaeche',
      title: 'Wohnfläche',
      type: 'string'
    }),
    defineField({
      name: 'zimmer',
      title: 'Zimmer',
      type: 'number'
    }),
    defineField({
      name: 'beschreibung',
      title: 'Beschreibung',
      type: 'text'
    }),
    defineField({
      name: 'bild',
      title: 'Bild',
      type: 'image'
    }),
    defineField({
      name: 'expose',
      title: 'Exposé (PDF)',
      type: 'file',
      options: {
        accept: '.pdf'
      }
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Verfügbar', value: 'verfuegbar'},
          {title: 'Verkauft', value: 'verkauft'},
          {title: 'Reserviert', value: 'reserviert'}
        ]
      }
    })
  ]
})
