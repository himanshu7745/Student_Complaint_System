import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

export function DataTable({ columns, rows, rowKey = 'id', onRowClick, empty }) {
  if (!rows?.length) return empty || null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => <TableHead key={column.key}>{column.header}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row[rowKey] || JSON.stringify(row)}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {column.render ? column.render(row) : row[column.key]}
              </TableCell>
            ))}
            {onRowClick ? (
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onRowClick(row)}>
                  Open
                </Button>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
